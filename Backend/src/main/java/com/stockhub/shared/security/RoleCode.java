package com.stockhub.shared.security;

/** The fixed system roles of the MVP, ordered by rank. */
public enum RoleCode {
    SUPER_ADMIN(100, true),
    ADMIN(40, false),
    MANAGER(30, false),
    MAGASINIER(20, false),
    VENDEUR(10, false);

    private final int rank;
    private final boolean platform;

    RoleCode(int rank, boolean platform) {
        this.rank = rank;
        this.platform = platform;
    }

    public int rank() {
        return rank;
    }

    public boolean isPlatform() {
        return platform;
    }
}
