package com.stockhub.product.domain.valueobject;

/** Unit of measure of a product; quantities are decimals so that bulk goods are supported. */
public enum Unit {
    UNIT,
    KG,
    G,
    L,
    ML,
    M,
    BOX,
    PACK;

    /** Discrete units only accept whole quantities. */
    public boolean isDiscrete() {
        return this == UNIT || this == BOX || this == PACK;
    }
}
