package com.stockhub.warehouse;

import java.util.UUID;

/**
 * Extension point for modules that must veto the deactivation of a location
 * (e.g. the stock module while the location still holds stock). Implementations
 * throw a business exception to refuse.
 */
public interface LocationDeactivationGuard {

    void checkDeactivation(UUID companyId, UUID locationId);
}
