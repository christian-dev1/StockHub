package com.stockhub.supplier.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.Texts;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.supplier.domain.valueobject.SupplierContact;
import java.util.Objects;
import java.util.UUID;

/** A company that delivers goods. Suppliers are never deleted, only deactivated, to keep purchase history. */
public final class Supplier {

    public static final int MAX_LEAD_TIME_DAYS = 365;

    private final UUID id;
    private final UUID companyId;
    private String code;
    private String name;
    private SupplierContact contact;
    private String taxId;
    private Integer leadTimeDays;
    private String notes;
    private boolean active;
    private final long version;

    public Supplier(UUID id, UUID companyId, String code, String name, SupplierContact contact, String taxId,
                    Integer leadTimeDays, String notes, boolean active, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.code = Texts.code(code, "code", 30, "SUPPLIER");
        this.name = Texts.required(name, "name", 150, "SUPPLIER");
        this.contact = Objects.requireNonNull(contact);
        this.taxId = Texts.optional(taxId, "taxId", 50);
        this.leadTimeDays = validLeadTime(leadTimeDays);
        this.notes = Texts.optional(notes, "notes", 1000);
        this.active = active;
        this.version = version;
    }

    public static Supplier create(UUID companyId, String code, String name, SupplierContact contact, String taxId,
                                  Integer leadTimeDays, String notes) {
        return new Supplier(Ids.newId(), companyId, code, name, contact, taxId, leadTimeDays, notes, true, 0);
    }

    public void update(String newCode, String newName, SupplierContact newContact, String newTaxId,
                       Integer newLeadTimeDays, String newNotes) {
        this.code = Texts.code(newCode, "code", 30, "SUPPLIER");
        this.name = Texts.required(newName, "name", 150, "SUPPLIER");
        this.contact = Objects.requireNonNull(newContact);
        this.taxId = Texts.optional(newTaxId, "taxId", 50);
        this.leadTimeDays = validLeadTime(newLeadTimeDays);
        this.notes = Texts.optional(newNotes, "notes", 1000);
    }

    public void activate() {
        active = true;
    }

    public void deactivate() {
        active = false;
    }

    private static Integer validLeadTime(Integer days) {
        if (days != null && (days < 0 || days > MAX_LEAD_TIME_DAYS)) {
            throw new InvalidInputException("leadTimeDays", "SUPPLIER_LEAD_TIME_INVALID",
                    "Lead time must be between 0 and 365 days.");
        }
        return days;
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String code() { return code; }
    public String name() { return name; }
    public SupplierContact contact() { return contact; }
    public String taxId() { return taxId; }
    public Integer leadTimeDays() { return leadTimeDays; }
    public String notes() { return notes; }
    public boolean isActive() { return active; }
    public long version() { return version; }
}
