export const mapPrefillToTaxpayerForm = (prefillRes, itlPassword = '') => {
  console.log('prefillRes', JSON.stringify(prefillRes, null, 2));

  // ✅ in your case prefillRes itself is the "data"
  const d = prefillRes || {};
  const p = d?.personalInfo || {};
  const name = p?.assesseeName || {};
  const addr = p?.address || {};
  const banks = d?.bankAccountDtls?.[0]?.addtnlBankDetails || [];

  const decodeMaybeBase64 = (v) => {
    try {
      if (!v) return '';
      const s = String(v);

      if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length % 4 === 0) {
        const decoded = atob(s);
        if (/^\d{8,}$/.test(decoded)) return decoded;
      }
      return s;
    } catch {
      return String(v || '');
    }
  };

  /* ===================== TAXPAYER TYPE ===================== */
  // personalInfo.status examples: I / F / C / H / A / T / L etc (depends on source)
  const mapTaxpayerType = (status) => {
    const s = String(status || '')
      .trim()
      .toUpperCase();

    // ✅ handle "startsWith" too (if API sends "IND", "COMP", etc.)
    if (s.startsWith('I')) return 'Individual';
    if (s.startsWith('H')) return 'HUF';
    if (s.startsWith('F')) return 'Firm';
    if (s.startsWith('C')) return 'Company';
    if (s.startsWith('A')) return 'AOP/BOI';
    if (s.startsWith('T')) return 'Trust';
    if (s.startsWith('L')) return 'LLP';

    return ''; // unknown -> keep empty so user selects
  };

  /* ===================== RESIDENTIAL STATUS ===================== */
  // filingStatus.ResidentialStatus examples: RES / NOR / RNOR / NR / NRES etc.
  const mapResidentialStatus = (code) => {
    const r = String(code || '')
      .trim()
      .toUpperCase();

    if (r === 'RES' || r === 'R') return 'Resident';

    // Your message: "NOR then non resident likewise"
    // ✅ So NOR => Non-Resident
    // Note: some systems use NR / NRES for non-resident too.
    if (r === 'NOR' || r === 'NR' || r === 'NRES' || r === 'NONRES' || r === 'NON-RES') return 'Non-Resident';

    // ✅ RNOR explicitly supported
    if (r === 'RNOR') return 'RNOR';

    return '';
  };

  const resCode = prefillRes?.lastFiledITR?.filingStatus?.ResidentialStatus ?? p?.filingStatus?.ResidentialStatus ?? p?.filingStatus?.residentialStatus ?? '';

  const taxpayerType = mapTaxpayerType(p?.status || p?.orgFirmInfo?.StatusOrCompanyType);

  return {
    PersonalDetails: {
      firstName: name?.firstName || '',
      middleName: name?.middleName || '',
      lastName: name?.surNameOrOrgName || '',
      typeOfTaxPayer: taxpayerType,
      residentialStatus: mapResidentialStatus(resCode),
      gender: '', // not present in your prefill
      dob: p?.dob || '',
      aadharNumber: decodeMaybeBase64(p?.aadhaarCardNo) || '',
      pan: p?.pan || p?.assesseVerPan || '',
      passportNumber: '',
      itlPassword: String(itlPassword || '').trim(),
    },

    ContactAddressDetails: {
      mobileNumber: String(addr?.mobileNo || '').slice(-10),
      emailId: addr?.emailAddress || '',
      address1: addr?.residenceNo || '',
      address2: addr?.residenceName || '',
      address3: addr?.roadOrStreet || '',
      address4: addr?.localityOrArea || '',
      state: {}, // will set by PIN lookup / dropdown
      incomeTaxStateCode: addr?.stateCode ? String(addr.stateCode) : '',
      city: {}, // will set by PIN lookup / dropdown
      pin: String(addr?.pinCode || addr?.zipCode || ''),
      landLine: '',
    },

    BankDetails: {
      array:
        banks?.length > 0
          ? banks.map((b, idx) => ({
              accountNumber: String(b?.bankAccountNo || ''),
              cnfaccountNumber: String(b?.bankAccountNo || ''),
              bankName: b?.bankName || '',
              bankAddress: '',
              ifscCode: (b?.ifsccode || '').toUpperCase(),
              accountType: b?.AccountType || '',
              accountHolderType: 'Self',
              nominate: 'No',
              nomineeName: '',
              isDefaultACC: String(b?.useForRefund) === 'true' ? 'true' : idx === 0 ? 'true' : 'false',
              _verified: false,
            }))
          : [
              {
                accountNumber: '',
                cnfaccountNumber: '',
                bankName: '',
                bankAddress: '',
                ifscCode: '',
                accountType: '',
                accountHolderType: '',
                nominate: 'No',
                nomineeName: '',
                isDefaultACC: 'true',
                _verified: false,
              },
            ],
    },
  };
};
