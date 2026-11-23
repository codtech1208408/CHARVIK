export interface CharvikCompanyDetails {
  company_phone: string;
  company_email: string;
  company_website: string;
  company_gst: string;
  company_pan: string;
  company_address: string;
}

export const DEFAULT_CHARVIK_COMPANY_DETAILS: CharvikCompanyDetails = {
  company_phone: '+91 9505151527',
  company_email: 'charvikstaffingconsultancy@gmail.com',
  company_website: 'www.charvikstaffing.com',
  company_gst: '36ABCDE1234F1Z5',
  company_pan: 'AABPC1234D',
  company_address: 'Hyderabad, Telangana'
};

export const getSavedCharvikCompanyDetails = (): CharvikCompanyDetails => {
  try {
    const saved = localStorage.getItem('charvik_company_details');
    if (saved) {
      return { ...DEFAULT_CHARVIK_COMPANY_DETAILS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to load saved Charvik company details', err);
  }
  return { ...DEFAULT_CHARVIK_COMPANY_DETAILS };
};

export const saveCharvikCompanyDetails = (details: Partial<CharvikCompanyDetails>): CharvikCompanyDetails => {
  try {
    const current = getSavedCharvikCompanyDetails();
    const updated = { ...current, ...details };
    localStorage.setItem('charvik_company_details', JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save Charvik company details', err);
    return DEFAULT_CHARVIK_COMPANY_DETAILS;
  }
};
