import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import {
  CellLine,
  TableCell,
  TableRow,
  TableBody,
  TableContainer,
  tableId,
  TableHeaderCell,
  TableHeaderRow,
  TableHeader,
  HeaderCellLine,
  TABLE_TAGS,
} from '../formats/table';
import isDefined from '../utils/is_defined';
import { deltaEndsWith, applyFormat } from './clipboard';

const ELEMENT_NODE = 1;

class Table extends Module {
  static register() {
    Quill.register(CellLine);
    Quill.register(HeaderCellLine);
    Quill.register(TableHeaderCell);
    Quill.register(TableCell);
    Quill.register(TableHeaderRow);
    Quill.register(TableRow);
    Quill.register(TableBody);
    Quill.register(TableHeader);
    Quill.register(TableContainer);
  }

  constructor(...args) {
    super(...args);

    this.quill.clipboard.addTableBlot(CellLine.blotName);
    this.quill.clipboard.addTableBlot(TableHeaderCell.blotName);
    this.quill.clipboard.addMatcher('td, th', matchCell);
    this.quill.clipboard.addMatcher(ELEMENT_NODE, matchDimensions);

    this.listenBalanceCells();
  }

  balanceTables() {
    this.quill.scroll.descendants(TableContainer).forEach(table => {
      table.balanceCells();
    });
  }

  deleteColumn() {
    const [table, , cell] = this.getTable();
    if (!isDefined(cell)) {
      return;
    }

    table.deleteColumn(cell.cellOffset());
    this.quill.update(Quill.sources.USER);
  }

  deleteRow() {
    const [, row] = this.getTable();
    if (!isDefined(row)) {
      return;
    }

    row.remove();
    this.quill.update(Quill.sources.USER);
  }

  deleteTable() {
    const [table] = this.getTable();
    if (!isDefined(table)) {
      return;
    }

    const offset = table.offset();
    table.remove();
    this.quill.update(Quill.sources.USER);
    this.quill.setSelection(offset, Quill.sources.SILENT);
  }

  getTable(range = this.quill.getSelection()) {
    if (!isDefined(range)) {
      return [null, null, null, -1];
    }

    const [cellLine, offset] = this.quill.getLine(range.index);
    const allowedBlots = [CellLine.blotName, HeaderCellLine.blotName];
    if (
      !isDefined(cellLine) ||
      allowedBlots.indexOf(cellLine.statics.blotName) === -1
    ) {
      return [null, null, null, -1];
    }

    const cell = cellLine.parent;
    const row = cell.parent;
    const table = row.parent.parent;
    return [table, row, cell, offset];
  }

  insertColumn(offset) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (!isDefined(cell)) {
      return;
    }

    const column = cell.cellOffset();
    table.insertColumn(column + offset);
    this.quill.update(Quill.sources.USER);
    let shift = row.rowOffset();
    if (offset === 0) {
      shift += 1;
    }
    this.quill.setSelection(
      range.index + shift,
      range.length,
      Quill.sources.SILENT,
    );
  }

  insertColumnLeft() {
    this.insertColumn(0);
  }

  insertColumnRight() {
    this.insertColumn(1);
  }

  insertRow(offset) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (!isDefined(cell)) {
      return;
    }

    const index = row.rowOffset();
    table.insertRow(index + offset);
    this.quill.update(Quill.sources.USER);
    if (offset > 0) {
      this.quill.setSelection(range, Quill.sources.SILENT);
    } else {
      this.quill.setSelection(
        range.index + row.children.length,
        range.length,
        Quill.sources.SILENT,
      );
    }
  }

  insertRowAbove() {
    this.insertRow(0);
  }

  insertRowBelow() {
    this.insertRow(1);
  }

  insertHeaderRow() {
    const range = this.quill.getSelection();
    const [table, , cell] = this.getTable(range);
    if (!isDefined(cell)) {
      return;
    }

    table.insertHeaderRow();
    this.quill.update(Quill.sources.USER);
  }

  insertTable(rows, columns) {
    const range = this.quill.getSelection();
    if (!isDefined(range)) {
      return;
    }

    const delta = new Array(rows).fill(0).reduce(memo => {
      const rowId = tableId();
      const text = new Array(columns).fill('\n').join('');
      return memo.insert(text, {
        tableCellLine: { row: rowId, cell: tableId() },
      });
    }, new Delta().retain(range.index));
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
    this.balanceTables();
  }

  listenBalanceCells() {
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, mutations => {
      mutations.some(mutation => {
        if (
          ['TD', 'TH', 'TR', 'TBODY', 'THEAD', 'TABLE'].indexOf(
            mutation.target.tagName,
          ) !== -1
        ) {
          this.quill.once(Quill.events.TEXT_CHANGE, (delta, old, source) => {
            if (source !== Quill.sources.USER) return;
            this.balanceTables();
          });
          return true;
        }
        return false;
      });
    });

    this.quill.on(Quill.events.CONTENT_SETTED, () => {
      this.quill.once(Quill.events.TEXT_CHANGE, () => {
        this.balanceTables();
      });
    });
  }
}

function matchCell(node, delta) {
  const row = node.parentNode;
  const table =
    row.parentNode.tagName === 'TABLE'
      ? row.parentNode
      : row.parentNode.parentNode;
  const isHeaderRow = row.parentNode.tagName === 'THEAD' ? true : null;
  const rows = Array.from(table.querySelectorAll('tr'));
  const cells = Array.from(row.querySelectorAll('th,td'));
  const rowId = rows.indexOf(row) + 1;
  const cellId = cells.indexOf(node) + 1;
  const cellLineBlotName = isHeaderRow
    ? 'tableHeaderCellLine'
    : 'tableCellLine';

  if (delta.length() === 0) {
    delta = new Delta().insert('\n', {
      [cellLineBlotName]: { row: rowId, cell: cellId },
    });
    return delta;
  }
  if (!deltaEndsWith(delta, '\n')) {
    delta.insert('\n');
  }

  return applyFormat(delta, cellLineBlotName, { row: rowId, cell: cellId });
}

function matchDimensions(node, delta) {
  const isTableNode = TABLE_TAGS.indexOf(node.tagName) !== -1;
  return delta.reduce((newDelta, op) => {
    const isEmbed = typeof op.insert === 'object';
    const attributes = op.attributes || {};
    const { width, height, ...rest } = attributes;
    const formats =
      attributes.tableCellLine ||
      attributes.tableHeaderCellLine ||
      attributes.tableCell ||
      attributes.tableHeaderCell ||
      isTableNode ||
      isEmbed
        ? attributes
        : { ...rest };
    return newDelta.insert(op.insert, formats);
  }, new Delta());
}

export default Table;
