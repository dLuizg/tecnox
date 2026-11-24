export async function exportXlsx(rows: string[][], filename: string) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Dados");
  rows.forEach((row) => sheet.addRow(row.map((cell) => String(cell ?? ""))));
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
