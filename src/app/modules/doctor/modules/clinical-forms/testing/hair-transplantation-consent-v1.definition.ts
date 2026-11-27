import { FormDefinition } from '../models/clinical-forms.models';

/**
 * Hair Transplantation Consent Form V1, exactly as seeded by HMS.DAL HairTransplantationConsentV1Seed (published
 * versions are immutable, so this copy cannot drift). Used to check the generic renderer draws the whole form.
 */
export const HAIR_TRANSPLANTATION_CONSENT_V1: FormDefinition = {
  "schemaVersion": 1,
  "form": {
    "formKey": "hair-transplantation-consent",
    "formName": "Hair Transplantation Consent Form",
    "specialty": "hair-transplantation",
    "versionNumber": 1
  },
  "optionSets": {
    "yesNo": [
      {
        "value": "yes",
        "label": "Yes"
      },
      {
        "value": "no",
        "label": "No"
      }
    ]
  },
  "sections": [
    {
      "key": "patientInformation",
      "title": "Patient Information",
      "order": 1,
      "required": true,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "formDate",
          "type": "date",
          "label": "Date",
          "order": 1,
          "required": true,
          "validation": {
            "maxDate": "today"
          }
        },
        {
          "key": "fullName",
          "type": "patientBinding",
          "label": "Patient Name",
          "order": 2,
          "binding": "patient.fullName",
          "mode": "readOnly"
        },
        {
          "key": "patientNumber",
          "type": "patientBinding",
          "label": "Patient ID",
          "order": 3,
          "binding": "patient.patientViewId",
          "mode": "readOnly"
        },
        {
          "key": "age",
          "type": "patientBinding",
          "label": "Years / Age",
          "order": 4,
          "binding": "patient.ageDisplay",
          "mode": "derived"
        },
        {
          "key": "sex",
          "type": "patientBinding",
          "label": "Sex",
          "order": 5,
          "binding": "patient.gender",
          "mode": "readOnly"
        },
        {
          "key": "mobile",
          "type": "patientBinding",
          "label": "Mobile",
          "order": 6,
          "binding": "patient.phone",
          "mode": "readOnly"
        },
        {
          "key": "email",
          "type": "patientBinding",
          "label": "Email",
          "order": 7,
          "binding": "patient.email",
          "mode": "readOnly"
        },
        {
          "key": "relativesPhone",
          "type": "phone",
          "label": "Relative's Phone",
          "order": 8,
          "validation": {
            "maxLength": 20
          }
        },
        {
          "key": "correspondenceAddress",
          "type": "textarea",
          "label": "Correspondence Address",
          "order": 9,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "permanentAddress",
          "type": "textarea",
          "label": "Permanent Address",
          "order": 10,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "medicalHistory",
          "type": "textarea",
          "label": "If any, medical history",
          "order": 11,
          "validation": {
            "maxLength": 2000
          }
        }
      ]
    },
    {
      "key": "procedureConsent",
      "title": "Hair Transplantation Consent",
      "order": 2,
      "description": "The consent statements (1–10) explained to the patient are shown in full in the Consent and Signatures panel at the end of the form, where the patient signs.\nStatement 6 describes the strip (FUT) donor technique, as on the source form. If your clinic uses another technique (e.g. FUE), set your own consent wording in Clinical Forms Configuration before use.\nRecord the graft details discussed under statement 8 below.",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "graftsAvailable",
          "type": "number",
          "label": "Number of grafts available for the relevant area",
          "order": 1,
          "validation": {
            "min": 0,
            "max": 20000
          }
        },
        {
          "key": "graftsReceived",
          "type": "number",
          "label": "Number received",
          "order": 2,
          "validation": {
            "min": 0,
            "max": 20000
          }
        },
        {
          "key": "graftsSelected",
          "type": "number",
          "label": "Number of grafts selected after discussion",
          "order": 3,
          "required": true,
          "validation": {
            "min": 0,
            "max": 20000
          }
        },
        {
          "key": "coverageArea",
          "type": "text",
          "label": "Area(s) to be covered with these grafts during the session",
          "order": 4,
          "validation": {
            "maxLength": 500
          }
        }
      ]
    },
    {
      "key": "educationAcknowledgement",
      "title": "Patient Education Acknowledgement",
      "order": 3,
      "description": "During personal counselling, I have also read the following separately:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "causesAndMedicines",
          "type": "radio",
          "label": "Causes of hair loss and medicines for hair restoration",
          "order": 1,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "transplantMethods",
          "type": "radio",
          "label": "Methods of hair transplantation",
          "order": 2,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "agingProcesses",
          "type": "radio",
          "label": "Aging processes",
          "order": 3,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "preOperativeInstructions",
          "type": "radio",
          "label": "Instructions before the operation",
          "order": 4,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "postOperativeInstructions",
          "type": "radio",
          "label": "Instructions after the operation",
          "order": 5,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "techniquesPresentation",
          "type": "radio",
          "label": "PowerPoint presentation on hair transplantation techniques",
          "order": 6,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "consentFormCopy",
          "type": "radio",
          "label": "A copy of this consent form",
          "order": 7,
          "required": true,
          "optionSet": "yesNo"
        }
      ]
    },
    {
      "key": "medicalHistoryQuestionnaire",
      "title": "Medical History Questionnaire",
      "order": 4,
      "description": "Please answer the following questions correctly. Please disclose any relevant illness/medical history.",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "previousSurgery",
          "type": "radio",
          "label": "Have you ever undergone any surgery before?",
          "order": 1,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "previousSurgeryDetails",
          "type": "text",
          "label": "If yes, which surgery?",
          "order": 2,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "previousSurgery",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "previousLocalAnaesthesia",
          "type": "radio",
          "label": "Have you previously been given local anaesthesia?",
          "order": 3,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "toothExtracted",
          "type": "radio",
          "label": "Have you ever had a tooth extracted?",
          "order": 4,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "woundWithStitches",
          "type": "radio",
          "label": "Have you had any injury/wound for which stitches were applied?",
          "order": 5,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "stitchesProblem",
          "type": "radio",
          "label": "If yes, did you have any problem with it?",
          "order": 6,
          "required": true,
          "optionSet": "yesNo",
          "visibleWhen": {
            "field": "woundWithStitches",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "stitchesProblemDetails",
          "type": "text",
          "label": "If yes, describe the problem",
          "order": 7,
          "required": true,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "stitchesProblem",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "bleedingProblem",
          "type": "radio",
          "label": "Do you have any problem with blood clotting/bleeding?",
          "order": 8,
          "required": true,
          "alert": true,
          "optionSet": "yesNo"
        },
        {
          "key": "bleedingProblemDetails",
          "type": "text",
          "label": "If yes, please specify",
          "order": 9,
          "required": true,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "bleedingProblem",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "acidity",
          "type": "radio",
          "label": "Do you have any problem with acidity in the stomach?",
          "order": 10,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "smoking",
          "type": "radio",
          "label": "Do you smoke?",
          "order": 11,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "smokingQuantity",
          "type": "text",
          "label": "If yes, how much?",
          "order": 12,
          "required": true,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "smoking",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "alcohol",
          "type": "radio",
          "label": "Do you drink alcohol?",
          "order": 13,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "alcoholQuantity",
          "type": "text",
          "label": "If yes, how much?",
          "order": 14,
          "required": true,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "alcohol",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "excessiveTeaCoffee",
          "type": "radio",
          "label": "Do you drink excessive tea/coffee?",
          "order": 15,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "otherIllness",
          "type": "radio",
          "label": "Do you have diabetes/asthma/any other illness?",
          "order": 16,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "otherIllnessDetails",
          "type": "text",
          "label": "If yes, please specify",
          "order": 17,
          "required": true,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "otherIllness",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "recentTetanusInjection",
          "type": "radio",
          "label": "Have you taken a tetanus toxoid injection during the last few months?",
          "order": 18,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "faintsEasily",
          "type": "radio",
          "label": "Do you feel dizzy or faint on seeing blood? Are you a person who faints easily?",
          "order": 19,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "canUndergoStitchRemoval",
          "type": "radio",
          "label": "Can you tolerate/undergo removal of stitches after 12 days?",
          "order": 20,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "medicineAllergy",
          "type": "radio",
          "label": "Are you allergic to any medicine?",
          "order": 21,
          "required": true,
          "alert": true,
          "optionSet": "yesNo"
        },
        {
          "key": "medicineAllergyDetails",
          "type": "text",
          "label": "If yes, please specify",
          "order": 22,
          "required": true,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "medicineAllergy",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "currentMedicines",
          "type": "radio",
          "label": "Do you take any medicines for any specific problem?",
          "order": 23,
          "required": true,
          "optionSet": "yesNo"
        },
        {
          "key": "currentMedicinesDetails",
          "type": "text",
          "label": "If yes, please specify",
          "order": 24,
          "required": true,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "currentMedicines",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "instructionsReceived",
          "type": "radio",
          "label": "Have you received any instructions before and after the operation?",
          "order": 25,
          "required": true,
          "optionSet": "yesNo"
        }
      ]
    },
    {
      "key": "consent",
      "title": "Consent and Signatures",
      "order": 5,
      "required": true,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "procedureConsent",
          "type": "consent",
          "label": "Hair Transplantation Consent and Declaration",
          "order": 1,
          "required": true,
          "locked": true,
          "consentType": "hair-transplant-procedure"
        },
        {
          "key": "hairlineDesignConsent",
          "type": "consent",
          "label": "Hairline Design Acknowledgement",
          "order": 2,
          "required": true,
          "locked": true,
          "consentType": "hair-transplant-hairline-design"
        }
      ]
    }
  ],
  "consents": [
    {
      "consentType": "hair-transplant-procedure",
      "consentVersion": "1.0",
      "required": true,
      "allowGuardian": false,
      "requireSignature": true,
      "witnessOptional": true,
      "text": "I have been advised regarding hair transplantation. I confirm that the following points have been explained to me and I have understood them:\n\n1. I understand that male pattern baldness and hereditary factors are responsible for androgenetic alopecia. This is a progressive condition. I have been given the option of medical treatment with medicines for hair loss. I also understand that even after transplantation, I may need medicines for a long period (possibly several years) to preserve the existing hair, and I understand the advantages and disadvantages of long-term medication use.\n\n2. I understand that hair transplantation is a cosmetic procedure and I am involved in making the decision regarding the treatment option. I have been informed about the benefits and risks of this procedure.\n\n3. I understand that the doctors performing the operation will make every reasonable effort to achieve the best possible result; however, because individual results vary, the best possible result cannot always be guaranteed.\n\n4. I have been informed that after the procedure my scalp may not return completely to its original condition, and I should not expect perfection. I understand that hair transplantation does not always produce a completely perfect result.\n\n5. I understand that the procedure will be performed under local anaesthesia and I hereby give my consent for the same.\n\n6. The procedure has been explained to me as follows:\n(a) The skin from the back of the scalp will serve as the donor area. A strip of skin will be removed and the wound will be closed with sutures. I understand that a scar will remain in the donor area.\n(b) Hair follicles will be harvested from the donor area by using appropriate instruments and transplanted into the recipient/bald area.\n(c) The hairline design has been specifically discussed with me. A drawing has been made on my scalp and shown to me in the mirror. I understand that I may require a number of grafts to achieve the agreed hairline/design, and I accept the same.\n(d) I have been informed about the possible complications during and after the procedure:\n  i) Swelling may occur on the 3rd–5th day after the operation.\n  ii) Swelling may continue for up to one week.\n  iii) Wounds such as pits/bumps or similar lesions may occur during the 2nd–3rd month.\nI have also been informed that keloid and hypertrophic scars, which are complications that may occur with any surgery, may occur after transplantation.\n\n7. I understand that some hairs may shed for a period after the procedure, and proper development/growth of the transplanted hair may take 9–10 months after surgery.\n\n8. I have been informed about the number of grafts available for the relevant area. The number available, the number received and the number of grafts I have selected after proper discussion and consideration are recorded in this form. I understand fully which area(s) will be covered with this number of grafts during the session. I have been informed that more grafts and/or additional operations may be required for optimal cosmetic results. I understand that good results depend on the appropriate number of sessions.\n\n9. I understand that the process of hair loss may continue in other areas of the scalp even after surgery. Therefore, long-term treatment with medicines may be required.\n\n10. I have been given sufficient time to ask questions and all my questions have been answered fully and satisfactorily.\n\nI have read the above information / it has been translated and explained to me. I have understood it completely and have understood the procedure and the additional medical care that may be required during the procedure. I signed this consent form at a time when I was not under the effect of any sedative/anaesthetic medicine."
    },
    {
      "consentType": "hair-transplant-hairline-design",
      "consentVersion": "1.0",
      "required": true,
      "allowGuardian": false,
      "requireSignature": true,
      "witnessOptional": true,
      "text": "My hairline design has been made on my scalp with different options and I have discussed it in detail before giving my consent and before photography."
    }
  ]
};
