package com.stockhub.warehouse;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Public API of the locations module for other modules. */
public interface LocationApi {

    /** Creates the mandatory primary store of a new company, in the caller's transaction. */
    UUID createPrimaryLocation(UUID companyId, String companyName);

    /** Returns the subset of the given ids that are active locations of the company. */
    Set<UUID> findActiveIds(UUID companyId, Collection<UUID> locationIds);

    List<LocationSummary> findByIds(UUID companyId, Collection<UUID> locationIds);

    List<LocationSummary> findAllActive(UUID companyId);
}
