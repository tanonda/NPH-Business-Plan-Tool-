// Generated from the workbook Lists tab. Keep this file as a safe fallback even when reference tables are seeded in the database.

export type ReferenceDepartment = { name: string; jobCode: string; code?: string; label?: string; display?: string; costCenterCode: string; costCenterName: string };
export type JobCodeReference = { name: string; jobCode: string; code: string; label: string; display: string; costCenterCode: string; costCenterName: string };
export type CostCenterReference = { code: string; name: string; display: string; departmentName?: string };
export type AccountCodeReference = { code: string; label: string; description: string; display: string; category: string };

export const DEFAULT_REFERENCE_DATA = {
  "departments": [
    {
      "name": "Administration",
      "jobCode": "611180 VCH Administration",
      "code": "611180",
      "label": "VCH Administration",
      "display": "611180 VCH Administration",
      "costCenterCode": "611180",
      "costCenterName": "VCH Administration"
    },
    {
      "name": "Allied Health Services",
      "jobCode": "611155 VCH Allied Health Services",
      "code": "611155",
      "label": "VCH Allied Health Services",
      "display": "611155 VCH Allied Health Services",
      "costCenterCode": "611155",
      "costCenterName": "VCH Allied Health Services"
    },
    {
      "name": "Ante-natal Clinic",
      "jobCode": "",
      "code": "",
      "label": "Ante-natal Clinic",
      "display": "Ante-natal Clinic",
      "costCenterCode": "",
      "costCenterName": "Ante-natal Clinic"
    },
    {
      "name": "Biomedical Services",
      "jobCode": "611191 VCH Maintenance - Biomedical",
      "code": "611191",
      "label": "VCH Maintenance - Biomedical",
      "display": "611191 VCH Maintenance - Biomedical",
      "costCenterCode": "611191",
      "costCenterName": "VCH Maintenance - Biomedical"
    },
    {
      "name": "Building Utility Services",
      "jobCode": "611184 VCH Building Utility Services",
      "code": "611184",
      "label": "VCH Building Utility Services",
      "display": "611184 VCH Building Utility Services",
      "costCenterCode": "611184",
      "costCenterName": "VCH Building Utility Services"
    },
    {
      "name": "Catering Services",
      "jobCode": "611185 VCH Catering Services",
      "code": "611185",
      "label": "VCH Catering Services",
      "display": "611185 VCH Catering Services",
      "costCenterCode": "611185",
      "costCenterName": "VCH Catering Services"
    },
    {
      "name": "Cleaning Services",
      "jobCode": "611186 VCH Cleaning Services",
      "code": "611186",
      "label": "VCH Cleaning Services",
      "display": "611186 VCH Cleaning Services",
      "costCenterCode": "611186",
      "costCenterName": "VCH Cleaning Services"
    },
    {
      "name": "Continuing Medical Education",
      "jobCode": "",
      "code": "",
      "label": "Continuing Medical Education",
      "display": "Continuing Medical Education",
      "costCenterCode": "",
      "costCenterName": "Continuing Medical Education"
    },
    {
      "name": "Dental Services",
      "jobCode": "",
      "code": "",
      "label": "Dental Services",
      "display": "Dental Services",
      "costCenterCode": "",
      "costCenterName": "Dental Services"
    },
    {
      "name": "Emergency",
      "jobCode": "",
      "code": "",
      "label": "Emergency",
      "display": "Emergency",
      "costCenterCode": "",
      "costCenterName": "Emergency"
    },
    {
      "name": "Eye Clinic",
      "jobCode": "",
      "code": "",
      "label": "Eye Clinic",
      "display": "Eye Clinic",
      "costCenterCode": "",
      "costCenterName": "Eye Clinic"
    },
    {
      "name": "Inpatient-ISOLATION",
      "jobCode": "611106 VCH Inpatient - ISOLATION",
      "code": "611106",
      "label": "VCH Inpatient - ISOLATION",
      "display": "611106 VCH Inpatient - ISOLATION",
      "costCenterCode": "611106",
      "costCenterName": "VCH Inpatient - ISOLATION"
    },
    {
      "name": "Inpatient-MATERNITY",
      "jobCode": "611102 VCH Inpatient - MATERNITY",
      "code": "611102",
      "label": "VCH Inpatient - MATERNITY",
      "display": "611102 VCH Inpatient - MATERNITY",
      "costCenterCode": "611102",
      "costCenterName": "VCH Inpatient - MATERNITY"
    },
    {
      "name": "Inpatient-MEDICAL",
      "jobCode": "611105 VCH Inpatient - MEDICAL",
      "code": "611105",
      "label": "VCH Inpatient - MEDICAL",
      "display": "611105 VCH Inpatient - MEDICAL",
      "costCenterCode": "611105",
      "costCenterName": "VCH Inpatient - MEDICAL"
    },
    {
      "name": "Inpatient-Nursing",
      "jobCode": "611100 VCH Nursing - Inpatient Services",
      "code": "611100",
      "label": "VCH Nursing - Inpatient Services",
      "display": "611100 VCH Nursing - Inpatient Services",
      "costCenterCode": "611100",
      "costCenterName": "VCH Nursing - Inpatient Services"
    },
    {
      "name": "Inpatient-OT",
      "jobCode": "611101 VCH Inpatient - OT",
      "code": "611101",
      "label": "VCH Inpatient - OT",
      "display": "611101 VCH Inpatient - OT",
      "costCenterCode": "611101",
      "costCenterName": "VCH Inpatient - OT"
    },
    {
      "name": "Inpatient-PEADIATRICS",
      "jobCode": "611103 VCH Inpatient - PAEDIATRICS",
      "code": "611103",
      "label": "VCH Inpatient - PAEDIATRICS",
      "display": "611103 VCH Inpatient - PAEDIATRICS",
      "costCenterCode": "611103",
      "costCenterName": "VCH Inpatient - PAEDIATRICS"
    },
    {
      "name": "Inpatient-SURGICAL",
      "jobCode": "611104 VCH Inpatient - SURGICAL",
      "code": "611104",
      "label": "VCH Inpatient - SURGICAL",
      "display": "611104 VCH Inpatient - SURGICAL",
      "costCenterCode": "611104",
      "costCenterName": "VCH Inpatient - SURGICAL"
    },
    {
      "name": "Inpatient-TB/Leprosy Ward",
      "jobCode": "",
      "code": "",
      "label": "Inpatient-TB/Leprosy Ward",
      "display": "Inpatient-TB/Leprosy Ward",
      "costCenterCode": "",
      "costCenterName": "Inpatient-TB/Leprosy Ward"
    },
    {
      "name": "Intensive Care Unit",
      "jobCode": "",
      "code": "",
      "label": "Intensive Care Unit",
      "display": "Intensive Care Unit",
      "costCenterCode": "",
      "costCenterName": "Intensive Care Unit"
    },
    {
      "name": "Laboratory",
      "jobCode": "611145 VCH Laboratory",
      "code": "611145",
      "label": "VCH Laboratory",
      "display": "611145 VCH Laboratory",
      "costCenterCode": "611145",
      "costCenterName": "VCH Laboratory"
    },
    {
      "name": "Laundry Services",
      "jobCode": "611187 VCH Laundry Services",
      "code": "611187",
      "label": "VCH Laundry Services",
      "display": "611187 VCH Laundry Services",
      "costCenterCode": "611187",
      "costCenterName": "VCH Laundry Services"
    },
    {
      "name": "Maintenance Services",
      "jobCode": "611190 VCH Maintenance Services",
      "code": "611190",
      "label": "VCH Maintenance Services",
      "display": "611190 VCH Maintenance Services",
      "costCenterCode": "611190",
      "costCenterName": "VCH Maintenance Services"
    },
    {
      "name": "Medical Gas Production",
      "jobCode": "611192 VCH Medical Gas Production",
      "code": "611192",
      "label": "VCH Medical Gas Production",
      "display": "611192 VCH Medical Gas Production",
      "costCenterCode": "611192",
      "costCenterName": "VCH Medical Gas Production"
    },
    {
      "name": "Medical Services",
      "jobCode": "611120 VCH Medical Services",
      "code": "611120",
      "label": "VCH Medical Services",
      "display": "611120 VCH Medical Services",
      "costCenterCode": "611120",
      "costCenterName": "VCH Medical Services"
    },
    {
      "name": "Medical Services-GENERAL",
      "jobCode": "611125 VCH Medical Services - GENERAL",
      "code": "611125",
      "label": "VCH Medical Services - GENERAL",
      "display": "611125 VCH Medical Services - GENERAL",
      "costCenterCode": "611125",
      "costCenterName": "VCH Medical Services - GENERAL"
    },
    {
      "name": "Nursing Services",
      "jobCode": "",
      "code": "",
      "label": "Nursing Services",
      "display": "Nursing Services",
      "costCenterCode": "",
      "costCenterName": "Nursing Services"
    },
    {
      "name": "General Outpatient Services",
      "jobCode": "611116 VCH Outpatient - GENERAL",
      "code": "611116",
      "label": "VCH Outpatient - GENERAL",
      "display": "611116 VCH Outpatient - GENERAL",
      "costCenterCode": "611116",
      "costCenterName": "VCH Outpatient - GENERAL"
    },
    {
      "name": "Outpatient-EMERGENCY",
      "jobCode": "611160 VCH Oral Health Service",
      "code": "611160",
      "label": "VCH Oral Health Service",
      "display": "611160 VCH Oral Health Service",
      "costCenterCode": "611160",
      "costCenterName": "VCH Oral Health Service"
    },
    {
      "name": "Outpatient-ENT",
      "jobCode": "611124 VCH Outpatient - EMERGENCY",
      "code": "611124",
      "label": "VCH Outpatient - EMERGENCY",
      "display": "611124 VCH Outpatient - EMERGENCY",
      "costCenterCode": "611124",
      "costCenterName": "VCH Outpatient - EMERGENCY"
    },
    {
      "name": "Outpatient-EYE",
      "jobCode": "611117 VCH Outpatient - ENT",
      "code": "611117",
      "label": "VCH Outpatient - ENT",
      "display": "611117 VCH Outpatient - ENT",
      "costCenterCode": "611117",
      "costCenterName": "VCH Outpatient - ENT"
    },
    {
      "name": "Outpatient-GENERAL",
      "jobCode": "611118 VCH Outpatient - EYE",
      "code": "611118",
      "label": "VCH Outpatient - EYE",
      "display": "611118 VCH Outpatient - EYE",
      "costCenterCode": "611118",
      "costCenterName": "VCH Outpatient - EYE"
    },
    {
      "name": "Outpatient-MENTAL HEALTH",
      "jobCode": "611123 VCH Outpatient - MENTAL HEALTH",
      "code": "611123",
      "label": "VCH Outpatient - MENTAL HEALTH",
      "display": "611123 VCH Outpatient - MENTAL HEALTH",
      "costCenterCode": "611123",
      "costCenterName": "VCH Outpatient - MENTAL HEALTH"
    },
    {
      "name": "Outpatient-NCD",
      "jobCode": "611126 VCH Outpatient - NCD",
      "code": "611126",
      "label": "VCH Outpatient - NCD",
      "display": "611126 VCH Outpatient - NCD",
      "costCenterCode": "611126",
      "costCenterName": "VCH Outpatient - NCD"
    },
    {
      "name": "Outpatient-Nursing",
      "jobCode": "611110 VCH Nursing - Outpatient Services",
      "code": "611110",
      "label": "VCH Nursing - Outpatient Services",
      "display": "611110 VCH Nursing - Outpatient Services",
      "costCenterCode": "611110",
      "costCenterName": "VCH Nursing - Outpatient Services"
    },
    {
      "name": "Outpatient-WOMENS HEALTH",
      "jobCode": "611119 VCH Outpatient - WOMENS HEALTH",
      "code": "611119",
      "label": "VCH Outpatient - WOMENS HEALTH",
      "display": "611119 VCH Outpatient - WOMENS HEALTH",
      "costCenterCode": "611119",
      "costCenterName": "VCH Outpatient - WOMENS HEALTH"
    },
    {
      "name": "Pharmacy",
      "jobCode": "611150 VCH Pharmacy",
      "code": "611150",
      "label": "VCH Pharmacy",
      "display": "611150 VCH Pharmacy",
      "costCenterCode": "611150",
      "costCenterName": "VCH Pharmacy"
    },
    {
      "name": "Radiography",
      "jobCode": "611140 VCH Radiography",
      "code": "611140",
      "label": "VCH Radiography",
      "display": "611140 VCH Radiography",
      "costCenterCode": "611140",
      "costCenterName": "VCH Radiography"
    },
    {
      "name": "Specimen Referrals",
      "jobCode": "",
      "code": "",
      "label": "Specimen Referrals",
      "display": "Specimen Referrals",
      "costCenterCode": "",
      "costCenterName": "Specimen Referrals"
    },
    {
      "name": "Theatre",
      "jobCode": "",
      "code": "",
      "label": "Theatre",
      "display": "Theatre",
      "costCenterCode": "",
      "costCenterName": "Theatre"
    },
    {
      "name": "Transport Services",
      "jobCode": "611181 VCH Transport Services",
      "code": "611181",
      "label": "VCH Transport Services",
      "display": "611181 VCH Transport Services",
      "costCenterCode": "611181",
      "costCenterName": "VCH Transport Services"
    },
    {
      "name": "Visiting Specialists",
      "jobCode": "611121 VCH Visiting Specialists",
      "code": "611121",
      "label": "VCH Visiting Specialists",
      "display": "611121 VCH Visiting Specialists",
      "costCenterCode": "611121",
      "costCenterName": "VCH Visiting Specialists"
    },
    {
      "name": "Disaster Reponse",
      "jobCode": "611197 VCH Disaster Response",
      "code": "611197",
      "label": "VCH Disaster Response",
      "display": "611197 VCH Disaster Response",
      "costCenterCode": "611197",
      "costCenterName": "VCH Disaster Response"
    }
  ],
  "jobCodes": [
    {
      "name": "Administration",
      "jobCode": "611180 VCH Administration",
      "code": "611180",
      "label": "VCH Administration",
      "display": "611180 VCH Administration",
      "costCenterCode": "611180",
      "costCenterName": "VCH Administration"
    },
    {
      "name": "Allied Health Services",
      "jobCode": "611155 VCH Allied Health Services",
      "code": "611155",
      "label": "VCH Allied Health Services",
      "display": "611155 VCH Allied Health Services",
      "costCenterCode": "611155",
      "costCenterName": "VCH Allied Health Services"
    },
    {
      "name": "Biomedical Services",
      "jobCode": "611191 VCH Maintenance - Biomedical",
      "code": "611191",
      "label": "VCH Maintenance - Biomedical",
      "display": "611191 VCH Maintenance - Biomedical",
      "costCenterCode": "611191",
      "costCenterName": "VCH Maintenance - Biomedical"
    },
    {
      "name": "Building Utility Services",
      "jobCode": "611184 VCH Building Utility Services",
      "code": "611184",
      "label": "VCH Building Utility Services",
      "display": "611184 VCH Building Utility Services",
      "costCenterCode": "611184",
      "costCenterName": "VCH Building Utility Services"
    },
    {
      "name": "Catering Services",
      "jobCode": "611185 VCH Catering Services",
      "code": "611185",
      "label": "VCH Catering Services",
      "display": "611185 VCH Catering Services",
      "costCenterCode": "611185",
      "costCenterName": "VCH Catering Services"
    },
    {
      "name": "Cleaning Services",
      "jobCode": "611186 VCH Cleaning Services",
      "code": "611186",
      "label": "VCH Cleaning Services",
      "display": "611186 VCH Cleaning Services",
      "costCenterCode": "611186",
      "costCenterName": "VCH Cleaning Services"
    },
    {
      "name": "Inpatient-ISOLATION",
      "jobCode": "611106 VCH Inpatient - ISOLATION",
      "code": "611106",
      "label": "VCH Inpatient - ISOLATION",
      "display": "611106 VCH Inpatient - ISOLATION",
      "costCenterCode": "611106",
      "costCenterName": "VCH Inpatient - ISOLATION"
    },
    {
      "name": "Inpatient-MATERNITY",
      "jobCode": "611102 VCH Inpatient - MATERNITY",
      "code": "611102",
      "label": "VCH Inpatient - MATERNITY",
      "display": "611102 VCH Inpatient - MATERNITY",
      "costCenterCode": "611102",
      "costCenterName": "VCH Inpatient - MATERNITY"
    },
    {
      "name": "Inpatient-MEDICAL",
      "jobCode": "611105 VCH Inpatient - MEDICAL",
      "code": "611105",
      "label": "VCH Inpatient - MEDICAL",
      "display": "611105 VCH Inpatient - MEDICAL",
      "costCenterCode": "611105",
      "costCenterName": "VCH Inpatient - MEDICAL"
    },
    {
      "name": "Inpatient-Nursing",
      "jobCode": "611100 VCH Nursing - Inpatient Services",
      "code": "611100",
      "label": "VCH Nursing - Inpatient Services",
      "display": "611100 VCH Nursing - Inpatient Services",
      "costCenterCode": "611100",
      "costCenterName": "VCH Nursing - Inpatient Services"
    },
    {
      "name": "Inpatient-OT",
      "jobCode": "611101 VCH Inpatient - OT",
      "code": "611101",
      "label": "VCH Inpatient - OT",
      "display": "611101 VCH Inpatient - OT",
      "costCenterCode": "611101",
      "costCenterName": "VCH Inpatient - OT"
    },
    {
      "name": "Inpatient-PEADIATRICS",
      "jobCode": "611103 VCH Inpatient - PAEDIATRICS",
      "code": "611103",
      "label": "VCH Inpatient - PAEDIATRICS",
      "display": "611103 VCH Inpatient - PAEDIATRICS",
      "costCenterCode": "611103",
      "costCenterName": "VCH Inpatient - PAEDIATRICS"
    },
    {
      "name": "Inpatient-SURGICAL",
      "jobCode": "611104 VCH Inpatient - SURGICAL",
      "code": "611104",
      "label": "VCH Inpatient - SURGICAL",
      "display": "611104 VCH Inpatient - SURGICAL",
      "costCenterCode": "611104",
      "costCenterName": "VCH Inpatient - SURGICAL"
    },
    {
      "name": "Laboratory",
      "jobCode": "611145 VCH Laboratory",
      "code": "611145",
      "label": "VCH Laboratory",
      "display": "611145 VCH Laboratory",
      "costCenterCode": "611145",
      "costCenterName": "VCH Laboratory"
    },
    {
      "name": "Laundry Services",
      "jobCode": "611187 VCH Laundry Services",
      "code": "611187",
      "label": "VCH Laundry Services",
      "display": "611187 VCH Laundry Services",
      "costCenterCode": "611187",
      "costCenterName": "VCH Laundry Services"
    },
    {
      "name": "Maintenance Services",
      "jobCode": "611190 VCH Maintenance Services",
      "code": "611190",
      "label": "VCH Maintenance Services",
      "display": "611190 VCH Maintenance Services",
      "costCenterCode": "611190",
      "costCenterName": "VCH Maintenance Services"
    },
    {
      "name": "Medical Gas Production",
      "jobCode": "611192 VCH Medical Gas Production",
      "code": "611192",
      "label": "VCH Medical Gas Production",
      "display": "611192 VCH Medical Gas Production",
      "costCenterCode": "611192",
      "costCenterName": "VCH Medical Gas Production"
    },
    {
      "name": "Medical Services",
      "jobCode": "611120 VCH Medical Services",
      "code": "611120",
      "label": "VCH Medical Services",
      "display": "611120 VCH Medical Services",
      "costCenterCode": "611120",
      "costCenterName": "VCH Medical Services"
    },
    {
      "name": "Medical Services-GENERAL",
      "jobCode": "611125 VCH Medical Services - GENERAL",
      "code": "611125",
      "label": "VCH Medical Services - GENERAL",
      "display": "611125 VCH Medical Services - GENERAL",
      "costCenterCode": "611125",
      "costCenterName": "VCH Medical Services - GENERAL"
    },
    {
      "name": "General Outpatient Services",
      "jobCode": "611116 VCH Outpatient - GENERAL",
      "code": "611116",
      "label": "VCH Outpatient - GENERAL",
      "display": "611116 VCH Outpatient - GENERAL",
      "costCenterCode": "611116",
      "costCenterName": "VCH Outpatient - GENERAL"
    },
    {
      "name": "Outpatient-EMERGENCY",
      "jobCode": "611160 VCH Oral Health Service",
      "code": "611160",
      "label": "VCH Oral Health Service",
      "display": "611160 VCH Oral Health Service",
      "costCenterCode": "611160",
      "costCenterName": "VCH Oral Health Service"
    },
    {
      "name": "Outpatient-ENT",
      "jobCode": "611124 VCH Outpatient - EMERGENCY",
      "code": "611124",
      "label": "VCH Outpatient - EMERGENCY",
      "display": "611124 VCH Outpatient - EMERGENCY",
      "costCenterCode": "611124",
      "costCenterName": "VCH Outpatient - EMERGENCY"
    },
    {
      "name": "Outpatient-EYE",
      "jobCode": "611117 VCH Outpatient - ENT",
      "code": "611117",
      "label": "VCH Outpatient - ENT",
      "display": "611117 VCH Outpatient - ENT",
      "costCenterCode": "611117",
      "costCenterName": "VCH Outpatient - ENT"
    },
    {
      "name": "Outpatient-GENERAL",
      "jobCode": "611118 VCH Outpatient - EYE",
      "code": "611118",
      "label": "VCH Outpatient - EYE",
      "display": "611118 VCH Outpatient - EYE",
      "costCenterCode": "611118",
      "costCenterName": "VCH Outpatient - EYE"
    },
    {
      "name": "Outpatient-MENTAL HEALTH",
      "jobCode": "611123 VCH Outpatient - MENTAL HEALTH",
      "code": "611123",
      "label": "VCH Outpatient - MENTAL HEALTH",
      "display": "611123 VCH Outpatient - MENTAL HEALTH",
      "costCenterCode": "611123",
      "costCenterName": "VCH Outpatient - MENTAL HEALTH"
    },
    {
      "name": "Outpatient-NCD",
      "jobCode": "611126 VCH Outpatient - NCD",
      "code": "611126",
      "label": "VCH Outpatient - NCD",
      "display": "611126 VCH Outpatient - NCD",
      "costCenterCode": "611126",
      "costCenterName": "VCH Outpatient - NCD"
    },
    {
      "name": "Outpatient-Nursing",
      "jobCode": "611110 VCH Nursing - Outpatient Services",
      "code": "611110",
      "label": "VCH Nursing - Outpatient Services",
      "display": "611110 VCH Nursing - Outpatient Services",
      "costCenterCode": "611110",
      "costCenterName": "VCH Nursing - Outpatient Services"
    },
    {
      "name": "Outpatient-WOMENS HEALTH",
      "jobCode": "611119 VCH Outpatient - WOMENS HEALTH",
      "code": "611119",
      "label": "VCH Outpatient - WOMENS HEALTH",
      "display": "611119 VCH Outpatient - WOMENS HEALTH",
      "costCenterCode": "611119",
      "costCenterName": "VCH Outpatient - WOMENS HEALTH"
    },
    {
      "name": "Pharmacy",
      "jobCode": "611150 VCH Pharmacy",
      "code": "611150",
      "label": "VCH Pharmacy",
      "display": "611150 VCH Pharmacy",
      "costCenterCode": "611150",
      "costCenterName": "VCH Pharmacy"
    },
    {
      "name": "Radiography",
      "jobCode": "611140 VCH Radiography",
      "code": "611140",
      "label": "VCH Radiography",
      "display": "611140 VCH Radiography",
      "costCenterCode": "611140",
      "costCenterName": "VCH Radiography"
    },
    {
      "name": "Transport Services",
      "jobCode": "611181 VCH Transport Services",
      "code": "611181",
      "label": "VCH Transport Services",
      "display": "611181 VCH Transport Services",
      "costCenterCode": "611181",
      "costCenterName": "VCH Transport Services"
    },
    {
      "name": "Visiting Specialists",
      "jobCode": "611121 VCH Visiting Specialists",
      "code": "611121",
      "label": "VCH Visiting Specialists",
      "display": "611121 VCH Visiting Specialists",
      "costCenterCode": "611121",
      "costCenterName": "VCH Visiting Specialists"
    },
    {
      "name": "Disaster Reponse",
      "jobCode": "611197 VCH Disaster Response",
      "code": "611197",
      "label": "VCH Disaster Response",
      "display": "611197 VCH Disaster Response",
      "costCenterCode": "611197",
      "costCenterName": "VCH Disaster Response"
    }
  ],
  "costCenters": [
    {
      "code": "611180",
      "name": "VCH Administration",
      "display": "611180 - VCH Administration",
      "departmentName": "Administration"
    },
    {
      "code": "611155",
      "name": "VCH Allied Health Services",
      "display": "611155 - VCH Allied Health Services",
      "departmentName": "Allied Health Services"
    },
    {
      "code": "611191",
      "name": "VCH Maintenance - Biomedical",
      "display": "611191 - VCH Maintenance - Biomedical",
      "departmentName": "Biomedical Services"
    },
    {
      "code": "611184",
      "name": "VCH Building Utility Services",
      "display": "611184 - VCH Building Utility Services",
      "departmentName": "Building Utility Services"
    },
    {
      "code": "611185",
      "name": "VCH Catering Services",
      "display": "611185 - VCH Catering Services",
      "departmentName": "Catering Services"
    },
    {
      "code": "611186",
      "name": "VCH Cleaning Services",
      "display": "611186 - VCH Cleaning Services",
      "departmentName": "Cleaning Services"
    },
    {
      "code": "611106",
      "name": "VCH Inpatient - ISOLATION",
      "display": "611106 - VCH Inpatient - ISOLATION",
      "departmentName": "Inpatient-ISOLATION"
    },
    {
      "code": "611102",
      "name": "VCH Inpatient - MATERNITY",
      "display": "611102 - VCH Inpatient - MATERNITY",
      "departmentName": "Inpatient-MATERNITY"
    },
    {
      "code": "611105",
      "name": "VCH Inpatient - MEDICAL",
      "display": "611105 - VCH Inpatient - MEDICAL",
      "departmentName": "Inpatient-MEDICAL"
    },
    {
      "code": "611100",
      "name": "VCH Nursing - Inpatient Services",
      "display": "611100 - VCH Nursing - Inpatient Services",
      "departmentName": "Inpatient-Nursing"
    },
    {
      "code": "611101",
      "name": "VCH Inpatient - OT",
      "display": "611101 - VCH Inpatient - OT",
      "departmentName": "Inpatient-OT"
    },
    {
      "code": "611103",
      "name": "VCH Inpatient - PAEDIATRICS",
      "display": "611103 - VCH Inpatient - PAEDIATRICS",
      "departmentName": "Inpatient-PEADIATRICS"
    },
    {
      "code": "611104",
      "name": "VCH Inpatient - SURGICAL",
      "display": "611104 - VCH Inpatient - SURGICAL",
      "departmentName": "Inpatient-SURGICAL"
    },
    {
      "code": "611145",
      "name": "VCH Laboratory",
      "display": "611145 - VCH Laboratory",
      "departmentName": "Laboratory"
    },
    {
      "code": "611187",
      "name": "VCH Laundry Services",
      "display": "611187 - VCH Laundry Services",
      "departmentName": "Laundry Services"
    },
    {
      "code": "611190",
      "name": "VCH Maintenance Services",
      "display": "611190 - VCH Maintenance Services",
      "departmentName": "Maintenance Services"
    },
    {
      "code": "611192",
      "name": "VCH Medical Gas Production",
      "display": "611192 - VCH Medical Gas Production",
      "departmentName": "Medical Gas Production"
    },
    {
      "code": "611120",
      "name": "VCH Medical Services",
      "display": "611120 - VCH Medical Services",
      "departmentName": "Medical Services"
    },
    {
      "code": "611125",
      "name": "VCH Medical Services - GENERAL",
      "display": "611125 - VCH Medical Services - GENERAL",
      "departmentName": "Medical Services-GENERAL"
    },
    {
      "code": "611116",
      "name": "VCH Outpatient - GENERAL",
      "display": "611116 - VCH Outpatient - GENERAL",
      "departmentName": "General Outpatient Services"
    },
    {
      "code": "611160",
      "name": "VCH Oral Health Service",
      "display": "611160 - VCH Oral Health Service",
      "departmentName": "Outpatient-EMERGENCY"
    },
    {
      "code": "611124",
      "name": "VCH Outpatient - EMERGENCY",
      "display": "611124 - VCH Outpatient - EMERGENCY",
      "departmentName": "Outpatient-ENT"
    },
    {
      "code": "611117",
      "name": "VCH Outpatient - ENT",
      "display": "611117 - VCH Outpatient - ENT",
      "departmentName": "Outpatient-EYE"
    },
    {
      "code": "611118",
      "name": "VCH Outpatient - EYE",
      "display": "611118 - VCH Outpatient - EYE",
      "departmentName": "Outpatient-GENERAL"
    },
    {
      "code": "611123",
      "name": "VCH Outpatient - MENTAL HEALTH",
      "display": "611123 - VCH Outpatient - MENTAL HEALTH",
      "departmentName": "Outpatient-MENTAL HEALTH"
    },
    {
      "code": "611126",
      "name": "VCH Outpatient - NCD",
      "display": "611126 - VCH Outpatient - NCD",
      "departmentName": "Outpatient-NCD"
    },
    {
      "code": "611110",
      "name": "VCH Nursing - Outpatient Services",
      "display": "611110 - VCH Nursing - Outpatient Services",
      "departmentName": "Outpatient-Nursing"
    },
    {
      "code": "611119",
      "name": "VCH Outpatient - WOMENS HEALTH",
      "display": "611119 - VCH Outpatient - WOMENS HEALTH",
      "departmentName": "Outpatient-WOMENS HEALTH"
    },
    {
      "code": "611150",
      "name": "VCH Pharmacy",
      "display": "611150 - VCH Pharmacy",
      "departmentName": "Pharmacy"
    },
    {
      "code": "611140",
      "name": "VCH Radiography",
      "display": "611140 - VCH Radiography",
      "departmentName": "Radiography"
    },
    {
      "code": "611181",
      "name": "VCH Transport Services",
      "display": "611181 - VCH Transport Services",
      "departmentName": "Transport Services"
    },
    {
      "code": "611121",
      "name": "VCH Visiting Specialists",
      "display": "611121 - VCH Visiting Specialists",
      "departmentName": "Visiting Specialists"
    },
    {
      "code": "611197",
      "name": "VCH Disaster Response",
      "display": "611197 - VCH Disaster Response",
      "departmentName": "Disaster Reponse"
    }
  ],
  "activityCategories": [
    "Training/workshop",
    "System Evaluation",
    "Supervision",
    "Referral",
    "SOPs, Policies, Guidelines",
    "IEC, advocacy & social mobilization",
    "International/Regional meetings",
    "Standard operations/running costs",
    "Community based projects",
    "Administration Support"
  ],
  "fundingSources": [
    "Recurrent",
    "Other"
  ],
  "budgetCategories": [
    "Travel",
    "Admin",
    "Procurement",
    "Logistics",
    "Finance_HR",
    "Assets_Infra",
    "Medical_Treatment",
    "Other Codes Not Listed"
  ],
  "accountCodes": [
    {
      "code": "8CAB",
      "label": "Subsistence Allowances",
      "description": "Subsistence Allowances",
      "display": "8CAB - Subsistence Allowances",
      "category": "Travel"
    },
    {
      "code": "8CAF",
      "label": "Food Allowances",
      "description": "Food Allowances",
      "display": "8CAF - Food Allowances",
      "category": "Travel"
    },
    {
      "code": "8CBI",
      "label": "International Accommodation",
      "description": "International Accommodation",
      "display": "8CBI - International Accommodation",
      "category": "Travel"
    },
    {
      "code": "8CBL",
      "label": "Local Accommodation",
      "description": "Local Accommodation",
      "display": "8CBL - Local Accommodation",
      "category": "Travel"
    },
    {
      "code": "8CCI",
      "label": "International Courses",
      "description": "International Courses",
      "display": "8CCI - International Courses",
      "category": "Travel"
    },
    {
      "code": "8CCL",
      "label": "Local Courses",
      "description": "Local Courses",
      "display": "8CCL - Local Courses",
      "category": "Travel"
    },
    {
      "code": "8CFS",
      "label": "Ship and Boat Fuel",
      "description": "Ship and Boat Fuel",
      "display": "8CFS - Ship and Boat Fuel",
      "category": "Travel"
    },
    {
      "code": "8CFV",
      "label": "Vehicle Fuel",
      "description": "Vehicle Fuel",
      "display": "8CFV - Vehicle Fuel",
      "category": "Travel"
    },
    {
      "code": "8CIE",
      "label": "Equipment Hire",
      "description": "Equipment Hire",
      "display": "8CIE - Equipment Hire",
      "category": "Travel"
    },
    {
      "code": "8CIF",
      "label": "Facilities Hire",
      "description": "Facilities Hire",
      "display": "8CIF - Facilities Hire",
      "category": "Travel"
    },
    {
      "code": "8CIV",
      "label": "Vehicle Hire",
      "description": "Vehicle Hire",
      "display": "8CIV - Vehicle Hire",
      "category": "Travel"
    },
    {
      "code": "8COP",
      "label": "Official Entertainment",
      "description": "Official Entertainment",
      "display": "8COP - Official Entertainment",
      "category": "Travel"
    },
    {
      "code": "8CTI",
      "label": "International Travel",
      "description": "International Travel",
      "display": "8CTI - International Travel",
      "category": "Travel"
    },
    {
      "code": "8CTL",
      "label": "Local Travel",
      "description": "Local Travel",
      "display": "8CTL - Local Travel",
      "category": "Travel"
    },
    {
      "code": "8COI",
      "label": "Incidentals",
      "description": "Incidentals",
      "display": "8COI - Incidentals",
      "category": "Travel"
    },
    {
      "code": "8CWL",
      "label": "Local Workshops",
      "description": "Local Workshops",
      "display": "8CWL - Local Workshops",
      "category": "Travel"
    },
    {
      "code": "8CKD",
      "label": "Advertising - Communications",
      "description": "Advertising - Communications",
      "display": "8CKD - Advertising - Communications",
      "category": "Admin"
    },
    {
      "code": "8CKR",
      "label": "Printing - Communications",
      "description": "Printing - Communications",
      "display": "8CKR - Printing - Communications",
      "category": "Admin"
    },
    {
      "code": "8CKS",
      "label": "Stationery - Communications",
      "description": "Stationery - Communications",
      "display": "8CKS - Stationery - Communications",
      "category": "Admin"
    },
    {
      "code": "8CKT",
      "label": "Telephone / Fax - Communications",
      "description": "Telephone / Fax - Communications",
      "display": "8CKT - Telephone / Fax - Communications",
      "category": "Admin"
    },
    {
      "code": "8CKP",
      "label": "Postage - Communications",
      "description": "Postage - Communications",
      "display": "8CKP - Postage - Communications",
      "category": "Admin"
    },
    {
      "code": "8CJH",
      "label": "Hospitals Cleaning",
      "description": "Hospitals Cleaning",
      "display": "8CJH - Hospitals Cleaning",
      "category": "Procurement"
    },
    {
      "code": "8CJO",
      "label": "Office Cleaning",
      "description": "Office Cleaning",
      "display": "8CJO - Office Cleaning",
      "category": "Procurement"
    },
    {
      "code": "8CMC",
      "label": "Curriculum - Materials",
      "description": "Curriculum - Materials",
      "display": "8CMC - Curriculum - Materials",
      "category": "Procurement"
    },
    {
      "code": "8CMG",
      "label": "General - Materials",
      "description": "General - Materials",
      "display": "8CMG - General - Materials",
      "category": "Procurement"
    },
    {
      "code": "8CMH",
      "label": "Hospitals - Materials",
      "description": "Hospitals - Materials",
      "display": "8CMH - Hospitals - Materials",
      "category": "Procurement"
    },
    {
      "code": "8CMS",
      "label": "Schools Materials",
      "description": "Schools Materials",
      "display": "8CMS - Schools Materials",
      "category": "Procurement"
    },
    {
      "code": "8COU",
      "label": "Uniforms",
      "description": "Uniforms",
      "display": "8COU - Uniforms",
      "category": "Procurement"
    },
    {
      "code": "8CRB",
      "label": "Food - Suppliers",
      "description": "Food - Suppliers",
      "display": "8CRB - Food - Suppliers",
      "category": "Procurement"
    },
    {
      "code": "8CSM",
      "label": "Medicines Suppliers",
      "description": "Medicines Suppliers",
      "display": "8CSM - Medicines Suppliers",
      "category": "Procurement"
    },
    {
      "code": "8CUC",
      "label": "Gas - Cooking Utilities",
      "description": "Gas - Cooking Utilities",
      "display": "8CUC - Gas - Cooking Utilities",
      "category": "Procurement"
    },
    {
      "code": "8CUE",
      "label": "Electricity Utilities",
      "description": "Electricity Utilities",
      "display": "8CUE - Electricity Utilities",
      "category": "Procurement"
    },
    {
      "code": "8CUM",
      "label": "Gas - Medical Utilities",
      "description": "Gas - Medical Utilities",
      "display": "8CUM - Gas - Medical Utilities",
      "category": "Procurement"
    },
    {
      "code": "8CUW",
      "label": "Water Utilities",
      "description": "Water Utilities",
      "display": "8CUW - Water Utilities",
      "category": "Procurement"
    },
    {
      "code": "8CSR",
      "label": "Rations Suppliers",
      "description": "Rations Suppliers",
      "display": "8CSR - Rations Suppliers",
      "category": "Procurement"
    },
    {
      "code": "8CMO",
      "label": "Office - Materials",
      "description": "Office - Materials",
      "display": "8CMO - Office - Materials",
      "category": "Procurement"
    },
    {
      "code": "8CNO",
      "label": "Office Rental",
      "description": "Office Rental",
      "display": "8CNO - Office Rental",
      "category": "Procurement"
    },
    {
      "code": "8CNT",
      "label": "Other Rental",
      "description": "Other Rental",
      "display": "8CNT - Other Rental",
      "category": "Procurement"
    },
    {
      "code": "8CSO",
      "label": "Other Suppliers",
      "description": "Other Suppliers",
      "display": "8CSO - Other Suppliers",
      "category": "Procurement"
    },
    {
      "code": "8CFO",
      "label": "Freight Fuel",
      "description": "Freight Fuel",
      "display": "8CFO - Freight Fuel",
      "category": "Logistics"
    },
    {
      "code": "8CGM",
      "label": "Mail Carriage Freight",
      "description": "Mail Carriage Freight",
      "display": "8CGM - Mail Carriage Freight",
      "category": "Logistics"
    },
    {
      "code": "8CGR",
      "label": "Transport - Freight",
      "description": "Transport - Freight",
      "display": "8CGR - Transport - Freight",
      "category": "Logistics"
    },
    {
      "code": "8CGS",
      "label": "Storage",
      "description": "Storage",
      "display": "8CGS - Storage",
      "category": "Logistics"
    },
    {
      "code": "8CHD",
      "label": "Medical Distributions",
      "description": "Medical Distributions",
      "display": "8CHD - Medical Distributions",
      "category": "Logistics"
    },
    {
      "code": "8CSD",
      "label": "Distribution Supplies",
      "description": "Distribution Supplies",
      "display": "8CSD - Distribution Supplies",
      "category": "Logistics"
    },
    {
      "code": "8CEC",
      "label": "Consultants Fees",
      "description": "Consultants Fees",
      "display": "8CEC - Consultants Fees",
      "category": "Finance_HR"
    },
    {
      "code": "8CES",
      "label": "Security Services",
      "description": "Security Services",
      "display": "8CES - Security Services",
      "category": "Finance_HR"
    },
    {
      "code": "8CET",
      "label": "Other Fees",
      "description": "Other Fees",
      "display": "8CET - Other Fees",
      "category": "Finance_HR"
    },
    {
      "code": "8COA",
      "label": "Audit Fees",
      "description": "Audit Fees",
      "display": "8COA - Audit Fees",
      "category": "Finance_HR"
    },
    {
      "code": "8COO",
      "label": "International Organisations",
      "description": "International Organisations",
      "display": "8COO - International Organisations",
      "category": "Finance_HR"
    },
    {
      "code": "8COR",
      "label": "Recruitment Costs",
      "description": "Recruitment Costs",
      "display": "8COR - Recruitment Costs",
      "category": "Finance_HR"
    },
    {
      "code": "8COS",
      "label": "Insurance",
      "description": "Insurance",
      "display": "8COS - Insurance",
      "category": "Finance_HR"
    },
    {
      "code": "8COT",
      "label": "Termination Payment",
      "description": "Termination Payment",
      "display": "8COT - Termination Payment",
      "category": "Finance_HR"
    },
    {
      "code": "8CZV",
      "label": "Value Added Tax",
      "description": "Value Added Tax",
      "display": "8CZV - Value Added Tax",
      "category": "Finance_HR"
    },
    {
      "code": "8FCB",
      "label": "Bank Charges",
      "description": "Bank Charges",
      "display": "8FCB - Bank Charges",
      "category": "Finance_HR"
    },
    {
      "code": "8AAA",
      "label": "Acting Allowances",
      "description": "Acting Allowances",
      "display": "8AAA - Acting Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8AAB",
      "label": "Responsibility Allowance",
      "description": "Responsibility Allowance",
      "display": "8AAB - Responsibility Allowance",
      "category": "Finance_HR"
    },
    {
      "code": "8AAC",
      "label": "On-Call Allowance",
      "description": "On-Call Allowance",
      "display": "8AAC - On-Call Allowance",
      "category": "Finance_HR"
    },
    {
      "code": "8AAD",
      "label": "Shift Allowance",
      "description": "Shift Allowance",
      "display": "8AAD - Shift Allowance",
      "category": "Finance_HR"
    },
    {
      "code": "8AAF",
      "label": "Family Allowance",
      "description": "Family Allowance",
      "display": "8AAF - Family Allowance",
      "category": "Finance_HR"
    },
    {
      "code": "8AAG",
      "label": "Gratuitie Allowances",
      "description": "Gratuitie Allowances",
      "display": "8AAG - Gratuitie Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8AAH",
      "label": "Housing Allowances",
      "description": "Housing Allowances",
      "display": "8AAH - Housing Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8AAO",
      "label": "Other Allowances",
      "description": "Other Allowances",
      "display": "8AAO - Other Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8AAP",
      "label": "Home Island Passage Allowances",
      "description": "Home Island Passage Allowances",
      "display": "8AAP - Home Island Passage Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8AAS",
      "label": "Special Allowances",
      "description": "Special Allowances",
      "display": "8AAS - Special Allowances",
      "category": "Finance_HR"
    },
    {
      "code": "8ASP",
      "label": "Provident Fund",
      "description": "Provident Fund",
      "display": "8ASP - Provident Fund",
      "category": "Finance_HR"
    },
    {
      "code": "8AWC",
      "label": "Contract Wages",
      "description": "Contract Wages",
      "display": "8AWC - Contract Wages",
      "category": "Finance_HR"
    },
    {
      "code": "8AWD",
      "label": "Daily Rated Wages",
      "description": "Daily Rated Wages",
      "display": "8AWD - Daily Rated Wages",
      "category": "Finance_HR"
    },
    {
      "code": "8AWL",
      "label": "Leave expense",
      "description": "Leave expense",
      "display": "8AWL - Leave expense",
      "category": "Finance_HR"
    },
    {
      "code": "8AWO",
      "label": "Overtime Wages",
      "description": "Overtime Wages",
      "display": "8AWO - Overtime Wages",
      "category": "Finance_HR"
    },
    {
      "code": "8AWP",
      "label": "Permanent Wages",
      "description": "Permanent Wages",
      "display": "8AWP - Permanent Wages",
      "category": "Finance_HR"
    },
    {
      "code": "PAYR",
      "label": "Payroll expenses",
      "description": "Payroll expenses",
      "display": "PAYR - Payroll expenses",
      "category": "Finance_HR"
    },
    {
      "code": "8CPA",
      "label": "Allowances - Scholarships",
      "description": "Allowances - Scholarships",
      "display": "8CPA - Allowances - Scholarships",
      "category": "Finance_HR"
    },
    {
      "code": "8COX",
      "label": "Curr Exch Loss/Gain",
      "description": "Curr Exch Loss/Gain",
      "display": "8COX - Curr Exch Loss/Gain",
      "category": "Finance_HR"
    },
    {
      "code": "8CXD",
      "label": "Death Benefit - Ex-gratia",
      "description": "Death Benefit - Ex-gratia",
      "display": "8CXD - Death Benefit - Ex-gratia",
      "category": "Finance_HR"
    },
    {
      "code": "8CPE",
      "label": "Fees - Scholarships",
      "description": "Fees - Scholarships",
      "display": "8CPE - Fees - Scholarships",
      "category": "Finance_HR"
    },
    {
      "code": "8EBN",
      "label": "Buildings - New",
      "description": "Buildings - New",
      "display": "8EBN - Buildings - New",
      "category": "Assets_Infra"
    },
    {
      "code": "8EBR",
      "label": "Buildings - Renovation",
      "description": "Buildings - Renovation",
      "display": "8EBR - Buildings - Renovation",
      "category": "Assets_Infra"
    },
    {
      "code": "8CRB",
      "label": "Buildings Repairs & Maintenance",
      "description": "Buildings Repairs & Maintenance",
      "display": "8CRB - Buildings Repairs & Maintenance",
      "category": "Assets_Infra"
    },
    {
      "code": "8CLC",
      "label": "Compensation Land",
      "description": "Compensation Land",
      "display": "8CLC - Compensation Land",
      "category": "Assets_Infra"
    },
    {
      "code": "8EEA",
      "label": "Equipment - Additional General",
      "description": "Equipment - Additional General",
      "display": "8EEA - Equipment - Additional General",
      "category": "Assets_Infra"
    },
    {
      "code": "8EEC",
      "label": "Computer Equipment",
      "description": "Computer Equipment",
      "display": "8EEC - Computer Equipment",
      "category": "Assets_Infra"
    },
    {
      "code": "8EET",
      "label": "Computer Software Purchases",
      "description": "Computer Software Purchases",
      "display": "8EET - Computer Software Purchases",
      "category": "Assets_Infra"
    },
    {
      "code": "8EEH",
      "label": "Equipment - Heavy Equipment",
      "description": "Equipment - Heavy Equipment",
      "display": "8EEH - Equipment - Heavy Equipment",
      "category": "Assets_Infra"
    },
    {
      "code": "8EEP",
      "label": "Equipment - Photocopiers",
      "description": "Equipment - Photocopiers",
      "display": "8EEP - Equipment - Photocopiers",
      "category": "Assets_Infra"
    },
    {
      "code": "8EES",
      "label": "Equipment - Specialised",
      "description": "Equipment - Specialised",
      "display": "8EES - Equipment - Specialised",
      "category": "Assets_Infra"
    },
    {
      "code": "8CRE",
      "label": "Equipment Repairs & Maintenance",
      "description": "Equipment Repairs & Maintenance",
      "display": "8CRE - Equipment Repairs & Maintenance",
      "category": "Assets_Infra"
    },
    {
      "code": "8EFH",
      "label": "Furniture - Housing Furniture",
      "description": "Furniture - Housing Furniture",
      "display": "8EFH - Furniture - Housing Furniture",
      "category": "Assets_Infra"
    },
    {
      "code": "8EFO",
      "label": "Furniture - Office Furniture",
      "description": "Furniture - Office Furniture",
      "display": "8EFO - Furniture - Office Furniture",
      "category": "Assets_Infra"
    },
    {
      "code": "8EHN",
      "label": "Houses - New Houses",
      "description": "Houses - New Houses",
      "display": "8EHN - Houses - New Houses",
      "category": "Assets_Infra"
    },
    {
      "code": "8EHR",
      "label": "Houses - Renovation",
      "description": "Houses - Renovation",
      "display": "8EHR - Houses - Renovation",
      "category": "Assets_Infra"
    },
    {
      "code": "8CRH",
      "label": "Houses Repairs & Maintenance",
      "description": "Houses Repairs & Maintenance",
      "display": "8CRH - Houses Repairs & Maintenance",
      "category": "Assets_Infra"
    },
    {
      "code": "8EIE",
      "label": "Infrastructure - Electricity",
      "description": "Infrastructure - Electricity",
      "display": "8EIE - Infrastructure - Electricity",
      "category": "Assets_Infra"
    },
    {
      "code": "8EIO",
      "label": "Infrastructure - Other",
      "description": "Infrastructure - Other",
      "display": "8EIO - Infrastructure - Other",
      "category": "Assets_Infra"
    },
    {
      "code": "8EIW",
      "label": "Infrastructure - Water Supply",
      "description": "Infrastructure - Water Supply",
      "display": "8EIW - Infrastructure - Water Supply",
      "category": "Assets_Infra"
    },
    {
      "code": "8CLL",
      "label": "Leases - Land",
      "description": "Leases - Land",
      "display": "8CLL - Leases - Land",
      "category": "Assets_Infra"
    },
    {
      "code": "8CRM",
      "label": "Maintenance Contract",
      "description": "Maintenance Contract",
      "display": "8CRM - Maintenance Contract",
      "category": "Assets_Infra"
    },
    {
      "code": "8CLR",
      "label": "Rates - Land",
      "description": "Rates - Land",
      "display": "8CLR - Rates - Land",
      "category": "Assets_Infra"
    },
    {
      "code": "8ESB",
      "label": "Ships and Boats Purchases",
      "description": "Ships and Boats Purchases",
      "display": "8ESB - Ships and Boats Purchases",
      "category": "Assets_Infra"
    },
    {
      "code": "8CLS",
      "label": "Survey Cost - Land",
      "description": "Survey Cost - Land",
      "display": "8CLS - Survey Cost - Land",
      "category": "Assets_Infra"
    },
    {
      "code": "8EVR",
      "label": "Vehicle - Replacement",
      "description": "Vehicle - Replacement",
      "display": "8EVR - Vehicle - Replacement",
      "category": "Assets_Infra"
    },
    {
      "code": "8EVA",
      "label": "Vehicle - Additional Vehicle",
      "description": "Vehicle - Additional Vehicle",
      "display": "8EVA - Vehicle - Additional Vehicle",
      "category": "Assets_Infra"
    },
    {
      "code": "8EVI",
      "label": "Vehicle - Industrial",
      "description": "Vehicle - Industrial",
      "display": "8EVI - Vehicle - Industrial",
      "category": "Assets_Infra"
    },
    {
      "code": "8CRV",
      "label": "Vehicles Repairs & Maintenance",
      "description": "Vehicles Repairs & Maintenance",
      "display": "8CRV - Vehicles Repairs & Maintenance",
      "category": "Assets_Infra"
    },
    {
      "code": "8EER",
      "label": "Equipment - Replacement General",
      "description": "Equipment - Replacement General",
      "display": "8EER - Equipment - Replacement General",
      "category": "Assets_Infra"
    },
    {
      "code": "8CHI",
      "label": "International Medical Treatment",
      "description": "International Medical Treatment",
      "display": "8CHI - International Medical Treatment",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CHL",
      "label": "Local Medical Treatment",
      "description": "Local Medical Treatment",
      "display": "8CHL - Local Medical Treatment",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CHV",
      "label": "Visiting Specialist - Medical Treatment",
      "description": "Visiting Specialist - Medical Treatment",
      "display": "8CHV - Visiting Specialist - Medical Treatment",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CHE",
      "label": "Equipment Hire Medical Treatment",
      "description": "Equipment Hire Medical Treatment",
      "display": "8CHE - Equipment Hire Medical Treatment",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CHT",
      "label": "Other Medical Treatment",
      "description": "Other Medical Treatment",
      "display": "8CHT - Other Medical Treatment",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CYS",
      "label": "Rescue Emergency",
      "description": "Rescue Emergency",
      "display": "8CYS - Rescue Emergency",
      "category": "Medical_Treatment"
    },
    {
      "code": "8CHX",
      "label": "X-Rays - Medical Treatment",
      "description": "X-Rays - Medical Treatment",
      "display": "8CHX - X-Rays - Medical Treatment",
      "category": "Medical_Treatment"
    }
  ],
  "nsdpTargets": [
    "SOC 3.1",
    "SOC 3.2",
    "SOC 3.3",
    "SOC 3.4"
  ]
} as const;
