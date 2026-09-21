package com.stockhub.company.application.usecase;

import com.stockhub.company.application.command.OnboardCompanyCommand.AdminAccount;
import com.stockhub.user.UserProvisioning;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Platform operation: give an existing company an additional administrator. */
@Service
public class AddCompanyAdminUseCase {

    private final CompanyLoader loader;
    private final UserProvisioning users;

    AddCompanyAdminUseCase(CompanyLoader loader, UserProvisioning users) {
        this.loader = loader;
        this.users = users;
    }

    @Transactional
    public UUID execute(UUID companyId, AdminAccount admin) {
        loader.load(companyId);
        return users.createCompanyAdmin(companyId, admin.email(), admin.firstName(), admin.lastName(),
                admin.temporaryPassword());
    }
}
