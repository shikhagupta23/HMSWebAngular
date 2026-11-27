import { FormDefinition } from '../models/clinical-forms.models';

/**
 * Medical Weight Management Intake V1, exactly as seeded by HMS.DAL WeightManagementIntakeV1Seed (published
 * versions are immutable, so this copy cannot drift). Used to check the generic renderer draws the whole form.
 */
export const WEIGHT_MANAGEMENT_INTAKE_V1: FormDefinition = {
  "schemaVersion": 1,
  "form": {
    "formKey": "weight-management-intake",
    "formName": "Medical Weight Management Intake",
    "specialty": "weight-management",
    "versionNumber": 1
  },
  "optionSets": {
    "ticked": [
      {
        "value": "yes",
        "label": "Yes"
      }
    ],
    "yesNo": [
      {
        "value": "yes",
        "label": "Yes"
      },
      {
        "value": "no",
        "label": "No"
      }
    ],
    "weightCategory": [
      {
        "value": "underweight",
        "label": "Underweight"
      },
      {
        "value": "average",
        "label": "Average Weight"
      },
      {
        "value": "overweight",
        "label": "Overweight"
      },
      {
        "value": "veryOverweight",
        "label": "Very overweight or obese"
      }
    ],
    "servings": [
      {
        "value": "none",
        "label": "None"
      },
      {
        "value": "lessThan1",
        "label": "less than 1"
      },
      {
        "value": "1-2",
        "label": "1-2"
      },
      {
        "value": "3-5",
        "label": "3-5"
      },
      {
        "value": "6plus",
        "label": "6+"
      }
    ],
    "promisIntensity": [
      {
        "value": "1",
        "label": "1 – Not at all"
      },
      {
        "value": "2",
        "label": "2 – A little bit"
      },
      {
        "value": "3",
        "label": "3 – Somewhat"
      },
      {
        "value": "4",
        "label": "4 – Quite a bit"
      },
      {
        "value": "5",
        "label": "5 – Very much"
      }
    ],
    "promisPositive": [
      {
        "value": "1",
        "label": "1 – Very much"
      },
      {
        "value": "2",
        "label": "2 – Quite a bit"
      },
      {
        "value": "3",
        "label": "3 – Somewhat"
      },
      {
        "value": "4",
        "label": "4 – A little bit"
      },
      {
        "value": "5",
        "label": "5 – Not at all"
      }
    ],
    "promisFrequency": [
      {
        "value": "1",
        "label": "1 – Never"
      },
      {
        "value": "2",
        "label": "2 – Rarely"
      },
      {
        "value": "3",
        "label": "3 – Sometimes"
      },
      {
        "value": "4",
        "label": "4 – Often"
      },
      {
        "value": "5",
        "label": "5 – Always"
      }
    ],
    "promisEnough": [
      {
        "value": "1",
        "label": "1 – Always"
      },
      {
        "value": "2",
        "label": "2 – Often"
      },
      {
        "value": "3",
        "label": "3 – Sometimes"
      },
      {
        "value": "4",
        "label": "4 – Rarely"
      },
      {
        "value": "5",
        "label": "5 – Never"
      }
    ],
    "promisQuality": [
      {
        "value": "1",
        "label": "1 – Very good"
      },
      {
        "value": "2",
        "label": "2 – Good"
      },
      {
        "value": "3",
        "label": "3 – Fair"
      },
      {
        "value": "4",
        "label": "4 – Poor"
      },
      {
        "value": "5",
        "label": "5 – Very Poor"
      }
    ],
    "dozing": [
      {
        "value": "0",
        "label": "0 = would never doze"
      },
      {
        "value": "1",
        "label": "1 = slight chance of dozing"
      },
      {
        "value": "2",
        "label": "2 = moderate chance of dozing"
      },
      {
        "value": "3",
        "label": "3 = high chance of dozing"
      }
    ],
    "relatives": [
      {
        "value": "child",
        "label": "Child"
      },
      {
        "value": "mother",
        "label": "Mother"
      },
      {
        "value": "father",
        "label": "Father"
      },
      {
        "value": "sister",
        "label": "Sister"
      },
      {
        "value": "brother",
        "label": "Brother"
      },
      {
        "value": "other",
        "label": "Other"
      }
    ],
    "bothered": [
      {
        "value": "0",
        "label": "0 = Not at all"
      },
      {
        "value": "1",
        "label": "1 = Several days"
      },
      {
        "value": "2",
        "label": "2 = More than half the days"
      },
      {
        "value": "3",
        "label": "3 = Nearly every day"
      }
    ],
    "bedsFrequency": [
      {
        "value": "neverOrRarely",
        "label": "Never or rarely"
      },
      {
        "value": "sometimes",
        "label": "Sometimes"
      },
      {
        "value": "often",
        "label": "Often"
      },
      {
        "value": "always",
        "label": "Always"
      }
    ],
    "eatingPatterns": [
      {
        "value": "flexible",
        "label": "Flexible healthy eating pattern"
      },
      {
        "value": "mediterranean",
        "label": "Mediterranean or similar eating pattern"
      },
      {
        "value": "plantBased",
        "label": "Plant-based or vegetarian"
      },
      {
        "value": "mealReplacements",
        "label": "Meal replacements (Involves purchasing a separate meal system; may be good option for those needing to lose weight quickly, such as before surgery)"
      },
      {
        "value": "other",
        "label": "Other"
      }
    ],
    "considerOption": [
      {
        "value": "yes",
        "label": "Yes"
      },
      {
        "value": "no",
        "label": "No"
      },
      {
        "value": "maybeLater",
        "label": "Maybe if needed later"
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
          "key": "fullName",
          "type": "patientBinding",
          "label": "Name",
          "order": 1,
          "binding": "patient.fullName",
          "mode": "readOnly"
        },
        {
          "key": "patientNumber",
          "type": "patientBinding",
          "label": "Patient ID",
          "order": 2,
          "binding": "patient.patientViewId",
          "mode": "readOnly"
        },
        {
          "key": "preferredName",
          "type": "text",
          "label": "Preferred Name",
          "order": 3,
          "validation": {
            "maxLength": 100
          }
        },
        {
          "key": "age",
          "type": "patientBinding",
          "label": "Current Age",
          "order": 4,
          "binding": "patient.ageDisplay",
          "mode": "derived"
        },
        {
          "key": "dateOfBirth",
          "type": "patientBinding",
          "label": "DOB",
          "order": 5,
          "binding": "patient.dateOfBirth",
          "mode": "readOnly"
        },
        {
          "key": "gender",
          "type": "patientBinding",
          "label": "Gender",
          "order": 6,
          "binding": "patient.gender",
          "mode": "readOnly"
        },
        {
          "key": "weightHistory0to12",
          "type": "radio",
          "label": "Describe weight history: 0-12 years old",
          "order": 7,
          "optionSet": "weightCategory"
        },
        {
          "key": "weightHistory13to18",
          "type": "radio",
          "label": "Describe weight history: 13-18 years old",
          "order": 8,
          "optionSet": "weightCategory"
        },
        {
          "key": "weightHistory19to35",
          "type": "radio",
          "label": "Describe weight history: 19-35 years old",
          "order": 9,
          "optionSet": "weightCategory"
        },
        {
          "key": "weightHistory35to50",
          "type": "radio",
          "label": "Describe weight history: 35-50+ years old",
          "order": 10,
          "optionSet": "weightCategory"
        },
        {
          "key": "highestWeight",
          "type": "number",
          "label": "Highest (non-pregnant) weight (lbs.)",
          "order": 11,
          "validation": {
            "min": 0,
            "max": 2000
          }
        },
        {
          "key": "highestWeightWhen",
          "type": "text",
          "label": "When",
          "order": 12,
          "validation": {
            "maxLength": 100
          }
        },
        {
          "key": "weightAtAge18",
          "type": "number",
          "label": "Weight at age 18",
          "order": 13,
          "validation": {
            "min": 0,
            "max": 2000
          }
        },
        {
          "key": "bariatricLowestWeight",
          "type": "number",
          "label": "If you had bariatric surgery, lowest weight achieved (lbs.)",
          "order": 14,
          "validation": {
            "min": 0,
            "max": 2000
          }
        },
        {
          "key": "bariatricLowestAfterMonths",
          "type": "number",
          "label": "Lowest was after (months)",
          "order": 15,
          "validation": {
            "min": 0,
            "max": 600
          }
        },
        {
          "key": "currentWeight",
          "type": "number",
          "label": "Current weight",
          "order": 16,
          "required": true,
          "validation": {
            "min": 0,
            "max": 2000
          }
        },
        {
          "key": "currentHeight",
          "type": "text",
          "label": "Current height",
          "order": 17,
          "required": true,
          "validation": {
            "maxLength": 20
          }
        },
        {
          "key": "weightHistoryDescription",
          "type": "textarea",
          "label": "Describe weight history. (Has gain been gradual or were there life events that affected weight, such as pregnancy, quitting smoking, emotional factors, personal issues, or job changes?)",
          "order": 18,
          "validation": {
            "maxLength": 4000
          }
        },
        {
          "key": "barriers",
          "type": "textarea",
          "label": "Any current barriers to weight-loss?",
          "order": 19,
          "validation": {
            "maxLength": 2000
          }
        },
        {
          "key": "motivation",
          "type": "textarea",
          "label": "What is your motivation for wanting to lose weight?",
          "order": 20,
          "validation": {
            "maxLength": 2000
          }
        },
        {
          "key": "programHopes",
          "type": "textarea",
          "label": "What are you hoping to get out of this program?",
          "order": 21,
          "validation": {
            "maxLength": 2000
          }
        }
      ]
    },
    {
      "key": "weightLossAttempts",
      "title": "Weight-Loss Attempts",
      "order": 2,
      "description": "Previous weight-loss attempts (Weight Watchers, Jenny Craig, Nutrisystem, Atkins, self-monitoring plan, work with dietitian, bariatric surgery, etc.)",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "attempts",
          "type": "repeater",
          "label": "Previous weight-loss attempts",
          "order": 1,
          "maxRows": 20,
          "columns": [
            {
              "key": "name",
              "type": "text",
              "label": "Name of attempt",
              "required": true,
              "validation": {
                "maxLength": 200
              }
            },
            {
              "key": "lengthOfTime",
              "type": "text",
              "label": "Length of time",
              "validation": {
                "maxLength": 100
              }
            },
            {
              "key": "lbsLost",
              "type": "number",
              "label": "Lbs. lost",
              "validation": {
                "min": 0,
                "max": 2000
              }
            },
            {
              "key": "comments",
              "type": "text",
              "label": "Comments",
              "validation": {
                "maxLength": 500
              }
            }
          ]
        },
        {
          "key": "medications",
          "type": "repeater",
          "label": "Weight-loss medications used (Meridia, Orlistat, Qsymia, Belviq, Phentermine, HCG, Dexatrim, Metabolife)",
          "order": 2,
          "maxRows": 20,
          "columns": [
            {
              "key": "name",
              "type": "text",
              "label": "Name of medicine",
              "required": true,
              "validation": {
                "maxLength": 200
              }
            },
            {
              "key": "lengthOfTime",
              "type": "text",
              "label": "Length of time",
              "validation": {
                "maxLength": 100
              }
            },
            {
              "key": "lbsLost",
              "type": "number",
              "label": "Lbs. lost",
              "validation": {
                "min": 0,
                "max": 2000
              }
            }
          ]
        }
      ]
    },
    {
      "key": "eatingHabits",
      "title": "Eating Habits",
      "order": 3,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "specialDiet",
          "type": "text",
          "label": "On a special diet currently or have any dietary restrictions (describe)?",
          "order": 1,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "specialDietLength",
          "type": "text",
          "label": "Length of time",
          "order": 2,
          "validation": {
            "maxLength": 100
          },
          "visibleWhen": {
            "field": "specialDiet",
            "op": "notEmpty"
          }
        },
        {
          "key": "groceryShopping",
          "type": "checkboxGroup",
          "label": "Who does the grocery shopping",
          "order": 3,
          "options": [
            {
              "value": "self",
              "label": "Self"
            },
            {
              "value": "other",
              "label": "Other"
            }
          ]
        },
        {
          "key": "groceryShoppingOther",
          "type": "text",
          "label": "Other (grocery shopping)",
          "order": 4,
          "validation": {
            "maxLength": 100
          },
          "visibleWhen": {
            "field": "groceryShopping",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "mealPreparation",
          "type": "checkboxGroup",
          "label": "Who does the meal preparation",
          "order": 5,
          "options": [
            {
              "value": "self",
              "label": "Self"
            },
            {
              "value": "other",
              "label": "Other"
            }
          ]
        },
        {
          "key": "mealPreparationOther",
          "type": "text",
          "label": "Other (meal preparation)",
          "order": 6,
          "validation": {
            "maxLength": 100
          },
          "visibleWhen": {
            "field": "mealPreparation",
            "op": "any",
            "value": [
              "other"
            ]
          }
        }
      ]
    },
    {
      "key": "foodSecurity",
      "title": "Food Security",
      "order": 4,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "worriedFoodRunOut",
          "type": "radio",
          "label": "In last 12 months, did you worry about food running out before you got money to buy more?",
          "order": 1,
          "optionSet": "yesNo"
        },
        {
          "key": "foodRanOut",
          "type": "radio",
          "label": "In last 12 months, did the food run out before you got money to buy more?",
          "order": 2,
          "optionSet": "yesNo"
        },
        {
          "key": "limitedFoodBudget",
          "type": "radio",
          "label": "On a limited food budget/rely on food stamps, food pantry for food?",
          "order": 3,
          "optionSet": "yesNo"
        },
        {
          "key": "limitedFoodBudgetExplain",
          "type": "text",
          "label": "If yes, explain",
          "order": 4,
          "validation": {
            "maxLength": 500
          },
          "visibleWhen": {
            "field": "limitedFoodBudget",
            "op": "eq",
            "value": "yes"
          }
        }
      ]
    },
    {
      "key": "eatingBehaviour",
      "title": "Eating Behaviour",
      "order": 5,
      "description": "Mark if any of the following common issues often apply to you. Keep in mind that each person has different struggles.",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "issues",
          "type": "conditionList",
          "label": "Tick any that apply",
          "order": 1,
          "itemOptionSet": "ticked",
          "items": [
            {
              "key": "irregularTiming",
              "label": "Irregular eating timing (variable eating times, lack of routine, skipping meals)"
            },
            {
              "key": "snacking",
              "label": "Snacking between meals. If yes, explain"
            },
            {
              "key": "mostlySnacks",
              "label": "Majority of food is snacks rather than meals"
            },
            {
              "key": "eatingQuickly",
              "label": "Eating quickly (less than 10 minutes)"
            },
            {
              "key": "largePortions",
              "label": "Portion sizes larger than needed"
            },
            {
              "key": "eatingUntilFull",
              "label": "Eating until uncomfortably full"
            },
            {
              "key": "mindlessEating",
              "label": "Eating mindlessly (while doing something else, like watching TV, or in car). If yes, when?"
            },
            {
              "key": "eatingOut",
              "label": "Eating “out” (fast food, restaurant, carry-out, etc.) If yes, is it fast food, sit-down restaurant, take-out, cafeteria, or other: Times per week"
            },
            {
              "key": "emotionalEating",
              "label": "Emotional eating. If yes, how often, and triggers"
            },
            {
              "key": "addictiveTendencies",
              "label": "Addictive tendencies toward any foods. If yes, explain"
            },
            {
              "key": "hunger",
              "label": "Hunger"
            },
            {
              "key": "problemFoods",
              "label": "Have “problem” foods (that you tend to crave or overeat) or foods that trigger overeating like sweets or salty foods). If yes, examples"
            },
            {
              "key": "processedFoods",
              "label": "Eat processed convenience foods (ex., ready-made, boxes meals). If yes, examples"
            },
            {
              "key": "lowFruitVegetables",
              "label": "Eating less than 5 servings total fruits and vegetables/day. Number fruit serving and examples; Number of vegetable servings and examples"
            },
            {
              "key": "sweets",
              "label": "Eating “sweets” (candy, cookies, etc.) Examples and frequency"
            },
            {
              "key": "poorSupport",
              "label": "Poor support system (unsupportive friends/family) If yes, examples"
            },
            {
              "key": "temptedByFoods",
              "label": "Often tempted to eat by foods seen or smelled, esp. at home or work. If yes, examples"
            },
            {
              "key": "lateEating",
              "label": "Eat more than 25% of food after evening meal."
            }
          ],
          "itemFields": [
            {
              "key": "details",
              "type": "text",
              "label": "Details",
              "validation": {
                "maxLength": 500
              },
              "visibleWhen": {
                "field": "@item.status",
                "op": "eq",
                "value": "yes"
              }
            }
          ]
        }
      ]
    },
    {
      "key": "beverages",
      "title": "Beverages",
      "order": 6,
      "description": "Please indicate your servings of beverages in an average day:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "juiceServings",
          "type": "radio",
          "label": "Juice",
          "order": 1,
          "optionSet": "servings"
        },
        {
          "key": "sodaType",
          "type": "checkboxGroup",
          "label": "Soda",
          "order": 2,
          "options": [
            {
              "value": "regular",
              "label": "Regular"
            },
            {
              "value": "diet",
              "label": "Diet"
            }
          ]
        },
        {
          "key": "sodaServings",
          "type": "radio",
          "label": "Soda servings",
          "order": 3,
          "optionSet": "servings"
        },
        {
          "key": "teaType",
          "type": "checkboxGroup",
          "label": "Tea",
          "order": 4,
          "options": [
            {
              "value": "sweet",
              "label": "Sweet"
            },
            {
              "value": "unsweet",
              "label": "Un-sweet"
            }
          ]
        },
        {
          "key": "teaServings",
          "type": "radio",
          "label": "Tea servings",
          "order": 5,
          "optionSet": "servings"
        },
        {
          "key": "coffeeType",
          "type": "checkboxGroup",
          "label": "Coffee",
          "order": 6,
          "options": [
            {
              "value": "cream",
              "label": "Cream"
            },
            {
              "value": "sugar",
              "label": "Sugar"
            }
          ]
        },
        {
          "key": "coffeeServings",
          "type": "radio",
          "label": "Coffee servings",
          "order": 7,
          "optionSet": "servings"
        },
        {
          "key": "waterServings",
          "type": "radio",
          "label": "Water",
          "order": 8,
          "optionSet": "servings"
        }
      ]
    },
    {
      "key": "auditC",
      "title": "AUDIT C",
      "order": 7,
      "description": "In the past year:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "drinkFrequency",
          "type": "radio",
          "label": "How often did you have a drink containing alcohol?",
          "order": 1,
          "options": [
            {
              "value": "0",
              "label": "0 – Never"
            },
            {
              "value": "1",
              "label": "1 – 1 day / month or less"
            },
            {
              "value": "2",
              "label": "2 – 2-4 days/ month"
            },
            {
              "value": "3",
              "label": "3 – 2-3 days per week"
            },
            {
              "value": "4",
              "label": "4 – 4+ days per week"
            }
          ]
        },
        {
          "key": "typicalDrinks",
          "type": "radio",
          "label": "On a typical day when drinking alcohol, how many drinks did you have?",
          "order": 2,
          "options": [
            {
              "value": "0",
              "label": "0 – 1-2"
            },
            {
              "value": "1",
              "label": "1 – 3-4"
            },
            {
              "value": "2",
              "label": "2 – 5-6"
            },
            {
              "value": "3",
              "label": "3 – 7-9"
            },
            {
              "value": "4",
              "label": "4 – 10+"
            }
          ]
        },
        {
          "key": "sixPlusDrinks",
          "type": "radio",
          "label": "How often have you had 6+ drinks on one occasion?",
          "order": 3,
          "options": [
            {
              "value": "0",
              "label": "0 – Never"
            },
            {
              "value": "1",
              "label": "1 – Less than monthly"
            },
            {
              "value": "2",
              "label": "2 – Monthly"
            },
            {
              "value": "3",
              "label": "3 – Weekly"
            },
            {
              "value": "4",
              "label": "4 – Daily or almost daily"
            }
          ]
        },
        {
          "key": "totalScore",
          "type": "number",
          "label": "Total Score",
          "order": 4,
          "helpText": "Entered by staff from the answers above; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 12
          }
        },
        {
          "key": "commonBeverages",
          "type": "text",
          "label": "Common alcoholic beverages consumed",
          "order": 5,
          "validation": {
            "maxLength": 500
          }
        }
      ]
    },
    {
      "key": "foodRecall",
      "title": "Food and Beverages in the Past 24 Hours",
      "order": 8,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "entries",
          "type": "repeater",
          "label": "Describe food or beverage consumed in past 24 hours (include amount eaten and method of prep)",
          "order": 1,
          "maxRows": 30,
          "columns": [
            {
              "key": "description",
              "type": "text",
              "label": "Food or beverage",
              "required": true,
              "validation": {
                "maxLength": 500
              }
            },
            {
              "key": "time",
              "type": "text",
              "label": "Time",
              "validation": {
                "maxLength": 20
              }
            },
            {
              "key": "calories",
              "type": "number",
              "label": "Calories (if known)",
              "validation": {
                "min": 0,
                "max": 10000
              }
            }
          ]
        }
      ]
    },
    {
      "key": "physicalActivity",
      "title": "Physical Activity",
      "order": 9,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "dailyActivity",
          "type": "radio",
          "label": "Physical activity in a typical day NOT from formal exercise",
          "order": 1,
          "options": [
            {
              "value": "sedentary",
              "label": "Sedentary (sitting most of day)"
            },
            {
              "value": "active",
              "label": "Active (standing most of day)"
            },
            {
              "value": "veryActive",
              "label": "Very active (walking most of day)"
            }
          ]
        },
        {
          "key": "exerciseDaysPerWeek",
          "type": "number",
          "label": "Physical activity from formal exercise: Days/week exercise outside normal daily activity (A)",
          "order": 2,
          "validation": {
            "min": 0,
            "max": 7
          }
        },
        {
          "key": "exerciseMinutesPerDay",
          "type": "number",
          "label": "Minutes each day exercise is performed (B)",
          "order": 3,
          "validation": {
            "min": 0,
            "max": 1440
          }
        },
        {
          "key": "minutesPerWeek",
          "type": "number",
          "label": "Days (A) x minutes (B) = minutes per week (Physical Activity Vital Sign)",
          "order": 4,
          "helpText": "Entered as on the paper form; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 10080
          }
        },
        {
          "key": "exerciseDescription",
          "type": "text",
          "label": "Describe (exercise)",
          "order": 5,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "strengthDaysPerWeek",
          "type": "number",
          "label": "How many days per week muscle strengthening exercises?",
          "order": 6,
          "validation": {
            "min": 0,
            "max": 7
          }
        },
        {
          "key": "strengthDescription",
          "type": "text",
          "label": "Describe (muscle strengthening)",
          "order": 7,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "activityLimitations",
          "type": "textarea",
          "label": "Describe any activity limitations",
          "order": 8,
          "validation": {
            "maxLength": 2000
          }
        },
        {
          "key": "ableToStandOrWalk",
          "type": "radio",
          "label": "Able to stand or walk by oneself for greater than 15 minutes without pain/need to sit?",
          "order": 9,
          "optionSet": "yesNo"
        },
        {
          "key": "tvHoursPerDay",
          "type": "number",
          "label": "Time spent on TV in a day (hours)",
          "order": 10,
          "validation": {
            "min": 0,
            "max": 24
          }
        },
        {
          "key": "screenHoursPerDay",
          "type": "number",
          "label": "Time spent on computer/phone in a day (hours)",
          "order": 11,
          "validation": {
            "min": 0,
            "max": 24
          }
        }
      ]
    },
    {
      "key": "sleepEvaluation",
      "title": "Sleep Evaluation",
      "order": 10,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "averageSleepHours",
          "type": "number",
          "label": "Average hours of sleep per night",
          "order": 1,
          "validation": {
            "min": 0,
            "max": 24
          }
        },
        {
          "key": "insomnia",
          "type": "radio",
          "label": "Do you often have insomnia?",
          "order": 2,
          "optionSet": "yesNo"
        },
        {
          "key": "nonRestorativeSleep",
          "type": "radio",
          "label": "Do you wake up tired after a night's sleep (non-restorative sleep)?",
          "order": 3,
          "optionSet": "yesNo"
        }
      ]
    },
    {
      "key": "promisSleep",
      "title": "PROMIS Sleep",
      "order": 11,
      "description": "Circle the appropriate choice that describes your sleep in the past 7 days\nIn the past 7 days",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "sleepRestless",
          "type": "radio",
          "label": "My sleep was restless",
          "order": 1,
          "optionSet": "promisIntensity"
        },
        {
          "key": "sleepSatisfied",
          "type": "radio",
          "label": "I was satisfied with my sleep",
          "order": 2,
          "optionSet": "promisPositive"
        },
        {
          "key": "sleepRefreshing",
          "type": "radio",
          "label": "My sleep was refreshing",
          "order": 3,
          "optionSet": "promisPositive"
        },
        {
          "key": "difficultyFallingAsleep",
          "type": "radio",
          "label": "I had difficulty falling asleep",
          "order": 4,
          "optionSet": "promisIntensity"
        },
        {
          "key": "troubleStayingAsleep",
          "type": "radio",
          "label": "I had trouble staying asleep",
          "order": 5,
          "optionSet": "promisFrequency"
        },
        {
          "key": "troubleSleeping",
          "type": "radio",
          "label": "I had trouble sleeping",
          "order": 6,
          "optionSet": "promisFrequency"
        },
        {
          "key": "enoughSleep",
          "type": "radio",
          "label": "I got enough sleep",
          "order": 7,
          "optionSet": "promisEnough"
        },
        {
          "key": "sleepQuality",
          "type": "radio",
          "label": "My sleep quality was",
          "order": 8,
          "optionSet": "promisQuality"
        },
        {
          "key": "totalScore",
          "type": "number",
          "label": "Total Score",
          "order": 9,
          "helpText": "Entered by staff from the answers above; not calculated by the system.",
          "validation": {
            "min": 8,
            "max": 40
          }
        }
      ]
    },
    {
      "key": "sleepApnea",
      "title": "Sleep Apnea",
      "order": 12,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "hasSleepApnea",
          "type": "radio",
          "label": "Do you have Sleep Apnea?",
          "order": 1,
          "optionSet": "yesNo"
        },
        {
          "key": "usesCpap",
          "type": "radio",
          "label": "If yes, do you wear a CPAP or Bipap machine at night?",
          "order": 2,
          "optionSet": "yesNo",
          "visibleWhen": {
            "field": "hasSleepApnea",
            "op": "eq",
            "value": "yes"
          }
        }
      ]
    },
    {
      "key": "epworth",
      "title": "Epworth",
      "order": 13,
      "description": "If you are NOT currently being treated for sleep apnea, please answer the questions below.\nIf you are NOT currently being treated for sleep apnea, use the scale below to choose the best number to rate each situation and your chance of dozing off during these situations.\nScale: 0 = would never doze; 1 = slight chance of dozing; 2 = moderate chance of dozing; 3 = high chance of dozing",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "snore",
          "type": "radio",
          "label": "1. Do you snore?",
          "order": 1,
          "optionSet": "yesNo",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "stoppedBreathing",
          "type": "radio",
          "label": "2. Has anyone ever told you that you stopped breathing at night?",
          "order": 2,
          "optionSet": "yesNo",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "gaspingAtNight",
          "type": "radio",
          "label": "3. Do you wake up at night gasping for breath or wake up feeling as if you are smothering?",
          "order": 3,
          "optionSet": "yesNo",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeSittingReading",
          "type": "radio",
          "label": "Sitting and reading",
          "order": 4,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeWatchingTv",
          "type": "radio",
          "label": "Watching TV",
          "order": 5,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozePublicPlace",
          "type": "radio",
          "label": "Sitting inactive in a public place (theater, meeting)",
          "order": 6,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeCarPassenger",
          "type": "radio",
          "label": "As a passenger in a car for an hour without a break",
          "order": 7,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeLyingDown",
          "type": "radio",
          "label": "Lying down to rest in the afternoon, when circumstances permit",
          "order": 8,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeTalking",
          "type": "radio",
          "label": "Sitting and talking to someone",
          "order": 9,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeAfterLunch",
          "type": "radio",
          "label": "Sitting quietly after lunch without alcohol",
          "order": 10,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "dozeInTraffic",
          "type": "radio",
          "label": "In a car, while stopped for a few minutes in traffic",
          "order": 11,
          "optionSet": "dozing",
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        },
        {
          "key": "total",
          "type": "number",
          "label": "Total",
          "order": 12,
          "helpText": "Entered by staff from the ratings above; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 24
          },
          "visibleWhen": {
            "field": "sleepApnea.usesCpap",
            "op": "neq",
            "value": "yes"
          }
        }
      ]
    },
    {
      "key": "socialHistory",
      "title": "Social History",
      "order": 14,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "relationshipStatus",
          "type": "radio",
          "label": "Relationship status",
          "order": 1,
          "options": [
            {
              "value": "single",
              "label": "Single"
            },
            {
              "value": "married",
              "label": "Married"
            },
            {
              "value": "divorced",
              "label": "Divorced"
            },
            {
              "value": "separated",
              "label": "Separated"
            },
            {
              "value": "widow",
              "label": "Widow"
            },
            {
              "value": "lifePartner",
              "label": "Life Partner"
            }
          ]
        },
        {
          "key": "householdMembers",
          "type": "text",
          "label": "Who lives in the home with you?",
          "order": 2,
          "validation": {
            "maxLength": 300
          }
        },
        {
          "key": "hasChildren",
          "type": "radio",
          "label": "Do you have children?",
          "order": 3,
          "optionSet": "yesNo"
        },
        {
          "key": "numberOfChildren",
          "type": "number",
          "label": "If yes, how many?",
          "order": 4,
          "validation": {
            "min": 0,
            "max": 30
          },
          "visibleWhen": {
            "field": "hasChildren",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "tobaccoUse",
          "type": "radio",
          "label": "Do you currently use tobacco products?",
          "order": 5,
          "options": [
            {
              "value": "current",
              "label": "Current"
            },
            {
              "value": "past",
              "label": "Past"
            },
            {
              "value": "present",
              "label": "Present"
            }
          ]
        },
        {
          "key": "tobaccoDetails",
          "type": "text",
          "label": "How much and what type",
          "order": 6,
          "validation": {
            "maxLength": 300
          },
          "visibleWhen": {
            "field": "tobaccoUse",
            "op": "notEmpty"
          }
        },
        {
          "key": "marijuanaUse",
          "type": "radio",
          "label": "Do you currently use Marijuana products?",
          "order": 7,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "education",
          "type": "text",
          "label": "Highest level of education",
          "order": 8,
          "validation": {
            "maxLength": 200
          }
        },
        {
          "key": "nightShifts",
          "type": "radio",
          "label": "Do you work night shifts?",
          "order": 9,
          "optionSet": "yesNo"
        },
        {
          "key": "occupation",
          "type": "text",
          "label": "What is your occupation?",
          "order": 10,
          "validation": {
            "maxLength": 200
          }
        }
      ]
    },
    {
      "key": "familyHistory",
      "title": "Family History",
      "order": 15,
      "description": "Please indicate if there is a family history of:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "obesity",
          "type": "checkboxGroup",
          "label": "Overweight/Obesity",
          "order": 1,
          "optionSet": "relatives"
        },
        {
          "key": "obesityOther",
          "type": "text",
          "label": "Other: (Overweight/Obesity)",
          "order": 2,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "obesity",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "diabetes",
          "type": "checkboxGroup",
          "label": "Diabetes (Type II)",
          "order": 3,
          "optionSet": "relatives"
        },
        {
          "key": "diabetesOther",
          "type": "text",
          "label": "Other: (Diabetes)",
          "order": 4,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "diabetes",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "thyroidCancer",
          "type": "checkboxGroup",
          "label": "Thyroid Cancer",
          "order": 5,
          "optionSet": "relatives"
        },
        {
          "key": "thyroidCancerOther",
          "type": "text",
          "label": "Other: (Thyroid Cancer)",
          "order": 6,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "thyroidCancer",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "stroke",
          "type": "checkboxGroup",
          "label": "Stroke",
          "order": 7,
          "optionSet": "relatives"
        },
        {
          "key": "strokeOther",
          "type": "text",
          "label": "Other: (Stroke)",
          "order": 8,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "stroke",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "heartDisease",
          "type": "checkboxGroup",
          "label": "Heart Disease",
          "order": 9,
          "optionSet": "relatives"
        },
        {
          "key": "heartDiseaseOther",
          "type": "text",
          "label": "Other: (Heart Disease)",
          "order": 10,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "heartDisease",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "otherNotable",
          "type": "textarea",
          "label": "Other notable family history, such as cancer",
          "order": 11,
          "validation": {
            "maxLength": 2000
          }
        }
      ]
    },
    {
      "key": "pastMedicalHistory",
      "title": "Past Medical History",
      "order": 16,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "existingPatient",
          "type": "radio",
          "label": "Are you an existing medicine patient of this clinic?",
          "order": 1,
          "optionSet": "yesNo",
          "helpText": "If yes, go to the next page if you prefer we obtain the information below from reviewing your electronic health record with you."
        },
        {
          "key": "chronicConditions",
          "type": "textarea",
          "label": "Please list chronic medical conditions: (diabetes mellitus, high blood pressure, cancer, heart or lung disease)",
          "order": 2,
          "validation": {
            "maxLength": 4000
          }
        },
        {
          "key": "previousSurgeries",
          "type": "textarea",
          "label": "Please list any previous surgeries (include any biopsy or cosmetic surgery)",
          "order": 3,
          "validation": {
            "maxLength": 4000
          }
        },
        {
          "key": "currentMedications",
          "type": "repeater",
          "label": "Please list any prescription medications that you are currently taking: (including over the counter supplies, supplements, vitamins, or herbals)",
          "order": 4,
          "maxRows": 40,
          "columns": [
            {
              "key": "name",
              "type": "text",
              "label": "Name",
              "required": true,
              "validation": {
                "maxLength": 200
              }
            },
            {
              "key": "dosage",
              "type": "text",
              "label": "Dosage instruction",
              "validation": {
                "maxLength": 300
              }
            }
          ]
        }
      ]
    },
    {
      "key": "reviewOfSystems",
      "title": "Review of Systems",
      "order": 17,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "systems",
          "type": "conditionList",
          "label": "Review of Systems",
          "order": 1,
          "itemOptionSet": "yesNo",
          "items": [
            {
              "key": "glaucoma",
              "label": "Do you have a history of glaucoma?"
            },
            {
              "key": "diabetes",
              "label": "Have you ever had diabetes (even if remission)?"
            },
            {
              "key": "thirstUrination",
              "label": "Do you feel thirsty frequently or urinate often?"
            },
            {
              "key": "thyroidDisease",
              "label": "Do you have a history of thyroid disease?"
            },
            {
              "key": "chestPain",
              "label": "Do you get chest pain?"
            },
            {
              "key": "heartValve",
              "label": "Do you have a history of heart valve problems?"
            },
            {
              "key": "heartDisease",
              "label": "Do you have a history of heart disease, coronary artery disease, heart attack, coronary artery bypass, angioplasty, heart stent, arrhythmia?"
            },
            {
              "key": "heartFailure",
              "label": "Do you have congestive heart failure?"
            },
            {
              "key": "heartTesting",
              "label": "Have you had any testing done on your heart?"
            },
            {
              "key": "breathing",
              "label": "Do you have asthma, shortness of breath, or wheezing?"
            },
            {
              "key": "sleepApnea",
              "label": "Do you have a history of sleep apnea?"
            },
            {
              "key": "gerd",
              "label": "Do you have a history of GERD (acid reflux)?"
            },
            {
              "key": "abdominalPain",
              "label": "Do you frequently get abdominal pain?"
            },
            {
              "key": "digestive",
              "label": "Do you get nausea, vomiting, constipation, diarrhea?"
            },
            {
              "key": "pancreatitis",
              "label": "Do you have a history of pancreatitis?"
            },
            {
              "key": "liver",
              "label": "Do you have a history of liver problems or high liver enzymes?"
            },
            {
              "key": "bladderLeakage",
              "label": "Do you have a history of bladder leakage?"
            },
            {
              "key": "kidneyStones",
              "label": "Do you have a history of kidney stones?"
            },
            {
              "key": "sexuality",
              "label": "Do you have problems with sexuality, such as loss of desire or erectile dysfunction?",
              "sensitive": true
            },
            {
              "key": "headaches",
              "label": "Do you get headaches or ever had migraines?"
            },
            {
              "key": "stroke",
              "label": "Do you have a history of a stroke or mini-stroke?"
            },
            {
              "key": "seizures",
              "label": "Do you have a history of seizures?"
            },
            {
              "key": "jointPain",
              "label": "Do you have a history of joint pain or back pain?"
            },
            {
              "key": "gout",
              "label": "Do you have a history of gout?"
            },
            {
              "key": "cSection",
              "label": "Were you born by C-section?"
            },
            {
              "key": "bottlefed",
              "label": "Were you solely bottlefed formula as a baby?"
            },
            {
              "key": "depression",
              "label": "Do you have a history of depression?",
              "sensitive": true
            },
            {
              "key": "anxiety",
              "label": "Do you have a history of anxiety?",
              "sensitive": true
            },
            {
              "key": "ptsd",
              "label": "Do you have a history of Post Traumatic Stress Disorder (PTSD)?",
              "sensitive": true
            },
            {
              "key": "otherMentalHealth",
              "label": "Do you have any other mental health condition?",
              "sensitive": true
            },
            {
              "key": "substanceAbuse",
              "label": "Do you have a history of substance abuse or addiction?",
              "sensitive": true
            },
            {
              "key": "anorexiaBulimia",
              "label": "Do you have a history of anorexia or bulimia?",
              "sensitive": true
            },
            {
              "key": "highStress",
              "label": "Would you rate your stress level as high?"
            },
            {
              "key": "irregularPeriodsPcos",
              "label": "Women only: Do you have irregular periods or PCOS?",
              "visibleWhen": {
                "source": "patient",
                "field": "gender",
                "op": "in",
                "value": [
                  "Female",
                  "female",
                  "F"
                ]
              }
            },
            {
              "key": "infertility",
              "label": "Women only: Do you have a history of infertility?",
              "visibleWhen": {
                "source": "patient",
                "field": "gender",
                "op": "in",
                "value": [
                  "Female",
                  "female",
                  "F"
                ]
              }
            },
            {
              "key": "pregnancyRisk",
              "label": "Women only: Are you planning or at risk for pregnancy in next year and not using birth control?",
              "visibleWhen": {
                "source": "patient",
                "field": "gender",
                "op": "in",
                "value": [
                  "Female",
                  "female",
                  "F"
                ]
              }
            },
            {
              "key": "pregnancyComplications",
              "label": "Women only: Did you have pregnancy complications?",
              "visibleWhen": {
                "source": "patient",
                "field": "gender",
                "op": "in",
                "value": [
                  "Female",
                  "female",
                  "F"
                ]
              }
            }
          ],
          "itemFields": [
            {
              "key": "detail",
              "type": "text",
              "label": "If yes, detail",
              "validation": {
                "maxLength": 500
              },
              "visibleWhen": {
                "field": "@item.status",
                "op": "eq",
                "value": "yes"
              }
            }
          ]
        }
      ]
    },
    {
      "key": "scoff",
      "title": "SCOFF Screening Tool",
      "order": 18,
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "makeYourselfSick",
          "type": "radio",
          "label": "1. Do you ever make yourself sick because you feel uncomfortably full?",
          "order": 1,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "lostControl",
          "type": "radio",
          "label": "2. Do you worry you have lost control over how much you eat?",
          "order": 2,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "lostFifteenPounds",
          "type": "radio",
          "label": "3. Have you recently lost more than fifteen pounds in a three-month period?",
          "order": 3,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "believeFat",
          "type": "radio",
          "label": "4. Do you believe yourself to be fat when others say you are too thin?",
          "order": 4,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "foodDominates",
          "type": "radio",
          "label": "5. Would you say that food dominates your life?",
          "order": 5,
          "optionSet": "yesNo",
          "sensitive": true
        },
        {
          "key": "totalYes",
          "type": "number",
          "label": "Total of yes answers",
          "order": 6,
          "helpText": "Entered by staff from the answers above; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 5
          }
        }
      ]
    },
    {
      "key": "gad7",
      "title": "GAD-7",
      "order": 19,
      "description": "Using the scale below, choose the best number to best describe how often you have been bothered in the last two weeks.\nScale: 0 = Not at all; 1 = Several days; 2 = More than half the days; 3 = Nearly every day",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "nervous",
          "type": "radio",
          "label": "Feeling nervous, anxious, or on edge",
          "order": 1,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "cannotStopWorrying",
          "type": "radio",
          "label": "Not being able to stop or control worrying",
          "order": 2,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "worryingTooMuch",
          "type": "radio",
          "label": "Worrying too much about different things",
          "order": 3,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "troubleRelaxing",
          "type": "radio",
          "label": "Trouble relaxing",
          "order": 4,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "restless",
          "type": "radio",
          "label": "Being so restless that it's hard to sit still",
          "order": 5,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "irritable",
          "type": "radio",
          "label": "Becoming easily annoyed or irritable",
          "order": 6,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "afraid",
          "type": "radio",
          "label": "Feeling afraid, as if something awful might happen",
          "order": 7,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "total",
          "type": "number",
          "label": "GAD-7 Total",
          "order": 8,
          "helpText": "Entered by staff from the answers above; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 21
          }
        }
      ]
    },
    {
      "key": "phq9",
      "title": "PHQ-9",
      "order": 20,
      "description": "Using the scale below, choose the best number to best describe how often you have been bothered in the last two weeks.\nScale: 0 = Not at all; 1 = Several days; 2 = More than half the days; 3 = Nearly every day",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "littleInterest",
          "type": "radio",
          "label": "Little interest or pleasure in doing things",
          "order": 1,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "feelingDown",
          "type": "radio",
          "label": "Feeling down, depressed, or hopeless",
          "order": 2,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "sleepTrouble",
          "type": "radio",
          "label": "Trouble falling or staying asleep, or sleeping too much",
          "order": 3,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "tired",
          "type": "radio",
          "label": "Feeling tired or having little energy",
          "order": 4,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "appetite",
          "type": "radio",
          "label": "Poor appetite or overeating",
          "order": 5,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "feelingBad",
          "type": "radio",
          "label": "Feeling bad about yourself, that you are a failure, or have let yourself or your family down",
          "order": 6,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "troubleConcentrating",
          "type": "radio",
          "label": "Trouble concentrating, like when reading the paper or watching TV",
          "order": 7,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "movingSlowlyOrRestless",
          "type": "radio",
          "label": "Moving or speaking so slowly that others could have noticed. Or so fidgety/ restless that you've been moving more than usual",
          "order": 8,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "thoughtsOfSelfHarm",
          "type": "radio",
          "label": "Thoughts that you would be better off dead or of hurting yourself",
          "order": 9,
          "optionSet": "bothered",
          "sensitive": true
        },
        {
          "key": "total",
          "type": "number",
          "label": "PHQ-9 Total",
          "order": 10,
          "helpText": "Entered by staff from the answers above; not calculated by the system.",
          "validation": {
            "min": 0,
            "max": 27
          }
        }
      ]
    },
    {
      "key": "beds7",
      "title": "Binge Eating Disorder (BEDS-7)",
      "order": 21,
      "description": "During the last three months:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "overeatingEpisodes",
          "type": "radio",
          "label": "A. Did you have any episodes of excessive overeating (eating significantly more than what most people would eat in a similar time?",
          "order": 1,
          "optionSet": "yesNo",
          "sensitive": true,
          "helpText": "If “no,” you do not need to fill out the rest of this page. If “yes,” continue to B."
        },
        {
          "key": "distressed",
          "type": "radio",
          "label": "B. Do you feel distressed about your episodes of excessive overeating?",
          "order": 2,
          "optionSet": "yesNo",
          "sensitive": true,
          "helpText": "If “no,” you do not need to fill out the bottom portion of this page. If “yes,” see below.",
          "visibleWhen": {
            "field": "overeatingEpisodes",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "noControl",
          "type": "radio",
          "label": "How often did you feel you had no control (not able to stop, compelled to eat, go back and forth for more food)?",
          "order": 3,
          "optionSet": "bedsFrequency",
          "sensitive": true,
          "helpText": "Statement about feelings during episodes (only do if you answered yes to B above.)",
          "visibleWhen": {
            "field": "distressed",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "eatingWhenNotHungry",
          "type": "radio",
          "label": "How often did you continue eating even though not hungry?",
          "order": 4,
          "optionSet": "bedsFrequency",
          "sensitive": true,
          "visibleWhen": {
            "field": "distressed",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "embarrassed",
          "type": "radio",
          "label": "How often were you embarrassed by how much you ate?",
          "order": 5,
          "optionSet": "bedsFrequency",
          "sensitive": true,
          "visibleWhen": {
            "field": "distressed",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "disgustedOrGuilty",
          "type": "radio",
          "label": "How often did you feel disgusted with self or guilty after?",
          "order": 6,
          "optionSet": "bedsFrequency",
          "sensitive": true,
          "visibleWhen": {
            "field": "distressed",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "vomiting",
          "type": "radio",
          "label": "During last 3 months, how often did you make yourself vomit to try to control your weight or shape?",
          "order": 7,
          "optionSet": "bedsFrequency",
          "sensitive": true,
          "visibleWhen": {
            "field": "distressed",
            "op": "eq",
            "value": "yes"
          }
        },
        {
          "key": "psychologistReferral",
          "type": "radio",
          "label": "Would you like a referral to a bariatric psychologist?",
          "order": 8,
          "optionSet": "yesNo",
          "helpText": "If you marked \"Sometimes,\" \"Often,\" or \"Always\" to any of the above, a referral is recommended."
        }
      ]
    },
    {
      "key": "choicesAndGoals",
      "title": "Choices and Goals",
      "order": 22,
      "description": "As described in our orientation video, our program is individualized. If you haven't seen it, please ask us for the link to hear about your options.\nPlease indicate choices, if known. May discuss first at appointment.",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "foodFirstChoice",
          "type": "select",
          "label": "Food: 1st choice",
          "order": 1,
          "optionSet": "eatingPatterns",
          "helpText": "The program includes several eating pattern options (indicate 1st and 2nd choices.)"
        },
        {
          "key": "foodSecondChoice",
          "type": "select",
          "label": "Food: 2nd choice",
          "order": 2,
          "optionSet": "eatingPatterns"
        },
        {
          "key": "plantBasedDescribe",
          "type": "text",
          "label": "Plant-based or vegetarian—describe",
          "order": 3,
          "validation": {
            "maxLength": 300
          }
        },
        {
          "key": "foodOtherName",
          "type": "text",
          "label": "Other (name)",
          "order": 4,
          "validation": {
            "maxLength": 200
          }
        },
        {
          "key": "movementChoices",
          "type": "checkboxGroup",
          "label": "Movement: The program includes physical activity. Please indicate your choice(s)",
          "order": 5,
          "options": [
            {
              "value": "walking",
              "label": "Walking"
            },
            {
              "value": "humanPerformanceLab",
              "label": "Human Performance Lab (additional fee; recommend initial and periodic evaluations at minimum)"
            },
            {
              "value": "physicalTherapy",
              "label": "Physical Therapy (currently in or need)"
            },
            {
              "value": "gym",
              "label": "Gym"
            },
            {
              "value": "other",
              "label": "Other"
            }
          ]
        },
        {
          "key": "gymName",
          "type": "text",
          "label": "Gym (name)",
          "order": 6,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "movementChoices",
            "op": "any",
            "value": [
              "gym"
            ]
          }
        },
        {
          "key": "movementOtherName",
          "type": "text",
          "label": "Other (name)",
          "order": 7,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "movementChoices",
            "op": "any",
            "value": [
              "other"
            ]
          }
        },
        {
          "key": "otherActivities",
          "type": "text",
          "label": "Are there any other types of physical activity you would enjoy and may consider adding?",
          "order": 8,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "loggingMethod",
          "type": "checkboxGroup",
          "label": "Behavior: The program includes self-monitoring. How would you like to log your food and behaviors?",
          "order": 9,
          "options": [
            {
              "value": "paper",
              "label": "Paper"
            },
            {
              "value": "app",
              "label": "App"
            }
          ]
        },
        {
          "key": "appName",
          "type": "text",
          "label": "If app, please name",
          "order": 10,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "loggingMethod",
            "op": "any",
            "value": [
              "app"
            ]
          }
        },
        {
          "key": "lifestyleGoals",
          "type": "textarea",
          "label": "What lifestyle change goals would you like to make or maintain (such as in the areas of food, physical activity, sleep or other)?",
          "order": 11,
          "validation": {
            "maxLength": 2000
          }
        },
        {
          "key": "goalWeight",
          "type": "number",
          "label": "Your personal goal weight (lbs.)",
          "order": 12,
          "validation": {
            "min": 0,
            "max": 2000
          }
        }
      ]
    },
    {
      "key": "supplementalPrograms",
      "title": "Optional Supplemental Programs",
      "order": 23,
      "description": "Optional supplemental programs can provide support. Please indicate your interest in these programs below:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "programs",
          "type": "checkboxGroup",
          "label": "Programs",
          "order": 1,
          "helpText": "Shared Medical Appointments (SMAs). SMAs include an educational discussion and a medical visit in a group setting. They are highly recommended as the support has been shown to help with weight loss. Participating in SMAs may enable you to be seen more often.",
          "options": [
            {
              "value": "findingWellness",
              "label": "Finding Wellness"
            },
            {
              "value": "diabetesPrevention",
              "label": "Diabetes Prevention Program"
            },
            {
              "value": "commercial",
              "label": "Commercial program"
            },
            {
              "value": "bariatricPsychologist",
              "label": "Referral to bariatric psychologist"
            },
            {
              "value": "community",
              "label": "Community program"
            },
            {
              "value": "sharedMedicalAppointments",
              "label": "Shared Medical Appointments (SMAs)"
            }
          ]
        },
        {
          "key": "commercialProgramName",
          "type": "text",
          "label": "Commercial program; please name",
          "order": 2,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "programs",
            "op": "any",
            "value": [
              "commercial"
            ]
          }
        },
        {
          "key": "communityProgramName",
          "type": "text",
          "label": "Community program; please name",
          "order": 3,
          "validation": {
            "maxLength": 200
          },
          "visibleWhen": {
            "field": "programs",
            "op": "any",
            "value": [
              "community"
            ]
          }
        }
      ]
    },
    {
      "key": "medicalOptions",
      "title": "Medical",
      "order": 24,
      "description": "The program may include prescription weight-loss medications or bariatric surgery if you are a candidate (will be decided by the medical physician and/or bariatric surgeon).\nPlease indicate if you would consider these options:",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "considerMedications",
          "type": "radio",
          "label": "Medications",
          "order": 1,
          "optionSet": "considerOption"
        },
        {
          "key": "medicationsComments",
          "type": "text",
          "label": "Comments (medications)",
          "order": 2,
          "validation": {
            "maxLength": 500
          }
        },
        {
          "key": "considerBariatricSurgery",
          "type": "radio",
          "label": "Bariatric surgery",
          "order": 3,
          "optionSet": "considerOption"
        },
        {
          "key": "bariatricSurgeryComments",
          "type": "text",
          "label": "Comments (bariatric surgery)",
          "order": 4,
          "validation": {
            "maxLength": 500
          }
        }
      ]
    },
    {
      "key": "schedule",
      "title": "Schedule",
      "order": 25,
      "description": "Recommended Schedule: After your first visit, you will have a 1-2 week follow-up with the registered dietitian. After that, you'll have medical visits approximately once a month, either as individual visits or an SMA (described above). We practice team-based care, so at your visits, you may be seen by a physician, advanced practice provider, dietitian, nurse, or other health professional. Our team communicates regularly, so all team members are aware of your goals and plan.",
      "editableBy": [
        "Receptionist",
        "Doctor"
      ],
      "clinical": false,
      "fields": [
        {
          "key": "visitPreferences",
          "type": "checkboxGroup",
          "label": "Visit preferences",
          "order": 1,
          "options": [
            {
              "value": "moreFrequent",
              "label": "Prefer visits more frequent than monthly"
            },
            {
              "value": "lessFrequent",
              "label": "Prefer visits less frequent than monthly"
            },
            {
              "value": "declineDietitian",
              "label": "Decline registered dietitian visit"
            }
          ]
        },
        {
          "key": "visitType",
          "type": "radio",
          "label": "Please select preferred visit type",
          "order": 2,
          "helpText": "Note: Certain conditions, medications, or participation in our meal replacement plan may require in-person visits, and we may ask you to be seen in-person at least yearly.",
          "options": [
            {
              "value": "video",
              "label": "Video"
            },
            {
              "value": "telephone",
              "label": "Telephone"
            },
            {
              "value": "inPerson",
              "label": "In-person"
            },
            {
              "value": "combination",
              "label": "Combination of in-person and virtual"
            }
          ]
        },
        {
          "key": "geneticTesting",
          "type": "radio",
          "label": "Genetic Testing",
          "order": 3,
          "helpText": "If you had obesity by the age of 10, you may qualify for free genetic testing. Please indicate your preference:",
          "options": [
            {
              "value": "test",
              "label": "Test"
            },
            {
              "value": "noTest",
              "label": "No test"
            },
            {
              "value": "discuss",
              "label": "Prefer to discuss further"
            },
            {
              "value": "doNotQualify",
              "label": "Do not qualify"
            }
          ]
        }
      ]
    }
  ],
  "consents": []
} as FormDefinition;
