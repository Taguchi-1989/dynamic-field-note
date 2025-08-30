const { app, BrowserWindow } = require("electron");
console.log("PDF test running...");
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL("data:text/html,<h1>PDF Test</h1>");
  const pdf = await win.webContents.printToPDF({ format: "A4" });
  console.log("PDF size:", pdf.length, "bytes");
  console.log("PDF generation: SUCCESS");
  app.quit();
});
