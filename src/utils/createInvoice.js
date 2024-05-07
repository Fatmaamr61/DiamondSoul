import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { PassThrough } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createInvoice(invoice) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();

  //generateHeader(doc);
  generateLogo(doc, doc.page.width); // Add this line to generate the logo
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

 doc.pipe(stream);
 doc.end();

 return stream;
}

// Function to generate the logo
function generateLogo(doc, pageWidth) {
  const logoWidth = 200; // Width of the logo
  const logoX = (pageWidth - logoWidth) / 2; // Calculate the x-coordinate to center the logo horizontally
  const logoPath = path.join(__dirname, "../../logo.png"); // Provide the path to your logo file
  doc.image(logoPath, logoX, 50, { width: logoWidth }); // Adjust the y-coordinate and size as needed
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Order Price:", 50, customerInformationTop + 30)
    .text(formatCurrency(invoice.paid), 150, customerInformationTop + 30)

    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.shipping.city, 300, customerInformationTop + 15)
    .text(invoice.shipping.fullAddress, 300, customerInformationTop + 30)
    .text(invoice.shipping.country, 300, customerInformationTop + 45)
    .moveDown();

  generateHr(doc, 260);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Item Price",
    "Quantity",
    "Item Total Price"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.name,
      formatCurrency(item.itemPrice),
      item.quantity,
      formatCurrency(item.totalPrice)
    );
    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const shippingPosition = subtotalPosition + (i + 1) * 20;
  generateTableRow(
    doc,
    shippingPosition,
    "",
    "shipping",
    "",
    formatCurrency(invoice.shippingCost)
  );

  const discount = (
    invoice.paid -
    (invoice.subtotal + invoice.shippingCost)
  ).toFixed(2);

  const discountPosition = shippingPosition + 20;
  generateTableRow(
    doc,
    discountPosition,
    "",
    "Discount",
    "",
    formatCurrency(discount)
  );

  const duePosition = discountPosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    duePosition,
    "",
    "Order Final Price",
    "",
    formatCurrency(invoice.paid)
  );
  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc.fontSize(10).text("KEEP GLOWING THE WORLD NEEDS YOUR MAGIC ", 50, 780, {
    align: "center",
    width: 500,
  });
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(Pounds) {
  return "EG" + Pounds;
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}
