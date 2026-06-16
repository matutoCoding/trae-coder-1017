import { Inbox } from "lucide-react";

interface Column<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: string | ((row: T) => string);
  emptyText?: string;
}

export function DataTable<T extends object = any>({
  columns,
  data,
  rowKey,
  emptyText = "暂无数据",
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }
    const value = row[rowKey];
    return value !== undefined ? String(value) : String(index);
  };

  const getCellValue = (row: T, column: Column<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }
    const value = row[column.key];
    return value !== undefined && value !== null ? String(value) : "-";
  };

  const isEmpty = data.length === 0;

  return (
    <div className="w-full overflow-auto rounded-xl border border-cream-200 bg-white">
      <table className="w-full min-w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-head">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-16 text-cream-500">
                  <Inbox className="w-12 h-12 mb-3 text-cream-400" />
                  <p className="text-sm font-medium">{emptyText}</p>
                  <p className="text-xs mt-1 text-cream-400">暂无匹配的记录</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={`
                  transition-colors duration-150 hover:bg-cream-50
                  ${rowIndex % 2 === 0 ? "bg-white" : "bg-cream-50/50"}
                `}
              >
                {columns.map((col, colIndex) => (
                  <td key={col.key} className={colIndex === 0 ? "table-cell font-medium text-forest-900" : "table-cell"}>
                    {getCellValue(row, col, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
