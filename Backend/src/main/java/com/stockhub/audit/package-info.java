/**
 * Immutable audit trail answering who did what, when, on which resource and in
 * which company. Entries are written synchronously inside the business
 * transaction so that an action can never be committed without its trace.
 */
@ApplicationModule(displayName = "Audit")
package com.stockhub.audit;

import org.springframework.modulith.ApplicationModule;
