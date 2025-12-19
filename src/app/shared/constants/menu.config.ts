export interface MenuItem {
  label: string;
  icon: string;
route?: string | ((role: string) => string);  roles: string[];
  hidden?: boolean;
  action?: string;   
  expanded?: boolean;
  children?: MenuItem[];  
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "fa-solid fa-shapes",
    route: "/dashboard",
    roles: [ "Doctor", "Receptionist"]
  },
  {
    label: "Dashboard",
    icon: "fa-solid fa-shapes",
    route: "/superadmin",
    roles: ["Admin", "SuperAdmin"]
  },
  {
    label: "Hospital",
    icon: "fa-solid fa-hospital",
    route: "/superadmin/hospital",
    roles: ["SuperAdmin"]
  },
  {
    label: "Users",
    icon: "fa-solid fa-users",
    route: "/superadmin/user",
    roles: ["SuperAdmin", "Admin"]
  },
  {
    label: "My Patients",
    icon: "fa-solid fa-user-injured",
    route: "/patient/allpatient",
    roles: ["Doctor", "Receptionist", "Admin"]
  },
  {
    label: "Today's Appointments",
    icon: "fa-solid fa-calendar-days",
    route: "/appointment/todayappointments",
    roles: ["Doctor", "Receptionist", "Admin"]
  },
  {
    label: "All Appointments",
    icon: "fa-solid fa-calendar-check",
    route: "/appointment/allappointments",
    roles: ["Doctor", "Receptionist", "Admin"]
  },
  {
    label: "FollowUp Appointments",
    icon: "fa-solid fa-clock-rotate-left",
    route: "/superadmin/upcoming-followup",
    roles: ["Admin", "Receptionist", "Doctor"]
  },  
  {
    label: "Invoice",
    icon: "fa-solid fa-receipt",
    route: "/invoice",
    roles: [""]
  },  
  {
    label: "Prescriptions",
    icon: "fa-solid fa-file-medical",
    route: "/doctor/prescription/add",
    roles: []
  },
 {
  label: "Drug Management",
  icon: "fas fa-pills",
  roles: ["Receptionist", "Doctor"],
  children: [
    {
      label: "Drug",
      icon: "fas fa-pills",
      route: "/drugmanagement/drug",
      roles: ["Receptionist", "Doctor"]
    },
    {
      label: "Drug Dose",
      icon: "fas fa-syringe",
      route: "/drugmanagement/drugdose",
      roles: ["Receptionist", "Doctor"]
    },
    {
      label: "Drug Advice",
      icon: "fas fa-notes-medical",
      route: "/drugmanagement/drugadvice",
      roles: ["Receptionist", "Doctor"]
    },
    {
      label: "Drug Strength",
      icon: "fas fa-weight-hanging",
      route: "/drugmanagement/drugstrength",
      roles: ["Receptionist", "Doctor"]
    },
    {
      label: "Drug Type",
      icon: "fas fa-capsules",
      route: "/drugmanagement/drugtype",
      roles: ["Receptionist", "Doctor"]
    },
    {
      label: "Drug Duration",
      icon: "fas fa-hourglass-half",
      route: "/drugmanagement/drugduration",
      roles: ["Receptionist", "Doctor"]
    }
  ]
},

  {
    label: "Lab Tests",
    icon: "fas fa-flask",
    route: "/superadmin/labtest",
    roles: ["SuperAdmin", "Admin", "Receptionist"]
  }, 
  {
    label: "Create Feature",
    icon: "fa-solid fa-square-plus",
    route: "/superadmin/create-feature",
    roles: ["SuperAdmin"]
  },
  {
    label: "Feature Assignment",
    icon: "fa-solid fa-user-gear",
    route: "/superadmin/feature-assignment",
    roles: ["SuperAdmin"]
  },
 
];
