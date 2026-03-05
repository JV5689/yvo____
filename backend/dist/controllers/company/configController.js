import { prisma } from '../../src/config/db.js';
// GET /company/config
// Returns the effective configuration for the logged-in user's company
export const getConfig = async (req, res) => {
    try {
        // In a real app, req.user.companyId would come from Auth Middleware
        // For scaffolding, we'll accept it as a header or query param for now
        const companyId = req.headers['x-company-id'] || req.query.companyId;
        if (!companyId) {
            return res.status(400).json({ message: 'Company Configuration requires company context' });
        }
        const company = await prisma.company.findUnique({
            where: { id: String(companyId) },
            include: { plan: true }
        });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        // 1. Fetch Global Flags
        const globalFlagsDocs = await prisma.featureFlag.findMany({ where: { isEnabled: true } });
        const globalFlags = {};
        globalFlagsDocs.forEach(f => {
            globalFlags[f.key] = f.value;
        });
        // 2. Plan Defaults
        const plan = company.plan;
        const planDefaults = plan.defaultFlags || {};
        // 3. Company Overrides
        const companyOverrides = company.featureFlags || {};
        // 4. Merge Logic (Last one wins)
        console.log(`[Config] Plan Defaults (${plan.name}):`, JSON.stringify(planDefaults));
        console.log(`[Config] Company Overrides (${company.name}):`, JSON.stringify(companyOverrides));
        let effectiveFlags = {
            ...globalFlags,
            ...planDefaults,
            ...companyOverrides
        };
        // ENFORCE SUBSCRIPTION EXPIRY
        // Logic Update: Trust 'active' status even if date is passed (Grace Period / Due)
        // Only lock if status is explicitly expired, suspended, or inactive
        const isAppLocked = company.subscriptionStatus !== 'active' && company.subscriptionStatus !== 'trial';
        if (isAppLocked) {
            console.log(`[Config] Company ${company.name} (${company.id}) is ${company.subscriptionStatus}. Locking all features.`);
            // Force all flags to false
            Object.keys(effectiveFlags).forEach(key => effectiveFlags[key] = false);
        }
        // Calculate effective limits
        const effectiveLimits = {
            ...plan.defaultLimits,
            ...(company.limitOverrides || {})
        };
        const responseData = {
            company: {
                id: company.id,
                name: company.name,
                plan: plan.name,
                subscriptionStatus: company.subscriptionStatus, // Return actual status
                invoiceEditPassword: company.invoiceEditPassword,
                invoiceAttributes: company.invoiceAttributes || [],
                // Profile
                logo: company.logo,
                email: company.email,
                phone: company.phone,
                website: company.website,
                address: company.address,
                currency: company.currency
            },
            flags: effectiveFlags,
            limits: effectiveLimits,
            // Return modules based on possibly locked flags
            modules: {
                finance: effectiveFlags['module_finance'] || effectiveFlags['finance'] || false,
                invoicing: effectiveFlags['module_invoicing'] || effectiveFlags['invoicing'] || false,
                inventory: effectiveFlags['module_inventory'] || effectiveFlags['inventory'] || false,
                employees: effectiveFlags['module_employees'] || effectiveFlags['employees'] || false,
                payroll: effectiveFlags['module_employees'] || effectiveFlags['employees'] || false,
                calendar: effectiveFlags['module_calendar'] || effectiveFlags['calendar'] || false,
                broadcasts: effectiveFlags['module_broadcasts'] || false,
                analytics: effectiveFlags['module_analytics'] || effectiveFlags['analytics'] || false, // Analytics also locked likely
                backup: effectiveFlags['module_backup'] || effectiveFlags['backup'] || false,
            }
        };
        // Return the "One Config Object to Rule Them All"
        res.json(responseData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Basic security: ensure user belongs to this company (middleware usually handles this, but here explicit check is good)
        // const company = await Company.findByIdAndUpdate(id, updates, { new: true });
        // Ensure we don't accidentally wipe feature flags if not passed
        // For now, simple update
        const company = await prisma.company.update({
            where: { id: String(id) },
            data: updates
        });
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const verifyPassword = async (req, res) => {
    try {
        const { companyId, password } = req.body;
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company)
            return res.status(404).json({ message: 'Company not found' });
        // Direct comparison for this feature
        const isValid = company.invoiceEditPassword === password;
        res.json({ valid: isValid });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const addInvoiceAttribute = async (req, res) => {
    try {
        const { companyId, attribute } = req.body;
        if (!companyId || !attribute) {
            return res.status(400).json({ message: 'companyId and attribute are required' });
        }
        const currentCompany = await prisma.company.findUnique({ where: { id: companyId } });
        const attrs = Array.isArray(currentCompany?.invoiceAttributes)
            ? currentCompany.invoiceAttributes
            : [];
        if (!attrs.includes(attribute)) {
            attrs.push(attribute);
        }
        const company = await prisma.company.update({
            where: { id: String(companyId) },
            data: { invoiceAttributes: attrs }
        });
        res.json({ invoiceAttributes: company.invoiceAttributes || [] });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
