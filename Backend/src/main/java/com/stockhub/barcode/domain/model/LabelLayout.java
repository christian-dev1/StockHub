package com.stockhub.barcode.domain.model;

/** Standard A4 adhesive label sheets (dimensions in millimetres). */
public enum LabelLayout {
    A4_3X8(3, 8, 70, 37),
    A4_2X7(2, 7, 99.1, 38.1),
    A4_4X10(4, 10, 48.5, 25.4);

    private final int columns;
    private final int rows;
    private final double widthMm;
    private final double heightMm;

    LabelLayout(int columns, int rows, double widthMm, double heightMm) {
        this.columns = columns;
        this.rows = rows;
        this.widthMm = widthMm;
        this.heightMm = heightMm;
    }

    public int columns() { return columns; }
    public int rows() { return rows; }
    public int perPage() { return columns * rows; }
    public double widthMm() { return widthMm; }
    public double heightMm() { return heightMm; }
}
