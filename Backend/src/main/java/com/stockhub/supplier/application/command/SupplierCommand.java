package com.stockhub.supplier.application.command;

import com.stockhub.supplier.domain.valueobject.SupplierContact;

/** @param code optional on creation: a code {@code SUP-0001} is generated when blank */
public record SupplierCommand(String code, String name, String contactName, String email, String phone,
                              String addressLine, String city, String country, String taxId, Integer leadTimeDays,
                              String notes) {

    public SupplierContact contact() {
        return new SupplierContact(contactName, email, phone, addressLine, city, country);
    }
}
