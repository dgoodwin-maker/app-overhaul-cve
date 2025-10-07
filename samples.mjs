// export const cveSamples = [
//     {
//         cveName: 'CVE-2024-0101',
//         cveDate: '2024-03-15',
//         cveDescription: 'Critical zero-day vulnerability found in a major content management system (CMS), allowing remote code execution.',
//         cveSeverity: '9.8'
//     },
//     {
//         cveName: 'CVE-2023-45678',
//         cveDate: '2023-10-01',
//         cveDescription: 'Buffer overflow in network service daemon leads to denial of service condition.',
//         cveSeverity: '6.5'
//     },
//     {
//         cveName: 'CVE-2022-99999',
//         cveDate: '2022-07-20',
//         cveDescription: 'Cross-site scripting (XSS) vulnerability impacting user profile pages.',
//         cveSeverity: '4.3'
//     }
// ];
// samples.mjs - REVISED DATA STRUCTURE
export const initialCveData = [
    {
        // Added _id for server-side array management
        _id: 1, 
        // Changed cveName to name
        name: 'CVE-2024-0101',
        // Changed cveDate to dateLogged and made it an ISO string
        dateLogged: '2024-03-15T00:00:00.000Z', 
        // Changed cveDescription to description
        description: 'Critical zero-day vulnerability found in a major content management system (CMS), allowing remote code execution.',
        // Changed cveSeverity to severity and ensured it's a number
        severity: 9.8,
        status: 'Pending'
    },
    {
        _id: 2,
        name: 'CVE-2023-45678',
        dateLogged: '2023-10-01T00:00:00.000Z',
        description: 'Buffer overflow in network service daemon leads to denial of service condition.',
        severity: 6.5,
        status: 'Pending'
    },
    {
        _id: 3,
        name: 'CVE-2022-99999',
        dateLogged: '2022-07-20T00:00:00.000Z',
        description: 'Cross-site scripting (XSS) vulnerability impacting user profile pages.',
        severity: 4.3,
        status: 'Pending'
    }
];