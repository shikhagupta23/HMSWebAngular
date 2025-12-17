export interface MenuItem {
  label: string;
  icon: string;
route?: string | ((role: string) => string);  roles: string[];
  hidden?: boolean;
  action?: string;     
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "fa-solid fa-shapes",
    route: "/dashboard",
    roles: [ "Doctor", "Receptionist"]
  }
  ,
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
    label: "Prescriptions",
    icon: "fa-solid fa-file-medical",
    route: "/doctor/prescription/add",
    roles: []
  },
  {
    label: "Drug Dose",
    icon: "fas fa-syringe",
    route: "/drugmanagement/drugdose",
    roles: ["Receptionist"]
  },
  {
    label: "Drug Advice",
    icon: "fas fa-notes-medical",
    route: "/drugmanagement/drugadvice",
    roles: ["Receptionist"]
  },
  {
    label: "Drug Strength",
    icon: "fas fa-weight-hanging",
    route: "/drugmanagement/drugstrength",
    roles: ["Receptionist"]
  },
  {
    label: "Drug Type",
    icon: "fas fa-capsules",
    route: "/drugmanagement/drugtype",
    roles: ["Receptionist"]
  },
  {
    label: "Drug Duration",
    icon: "fas fa-hourglass-half",
    route: "/drugmanagement/drugduration",
    roles: ["Receptionist"]
  },
  {
    label: "Drug",
    icon: "fas fa-pills",
    route: "/drugmanagement/drug",
    roles: ["Receptionist"]
  },
  {
    label: "Lab Tests",
    icon: "fas fa-pills",
    route: "/doctor/labtest/alllabtest",
    roles: []
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
  {
  label: "FollowUp Appointments",
  icon: "fa-solid fa-clock-rotate-left",
  route: "/superadmin/upcoming-followup",
  roles: ["Admin"]
},
{
  label: "Profile Setting",
  icon: "fa-solid fa-user",
  route: "/superadmin/profile-setting",
  roles: ["SuperAdmin", "Admin", "Doctor", "Receptionist"]
},
{
  label: "Change Password",
  icon: "fa-solid fa-lock",
  route: "/superadmin/change-password",
  roles: ["SuperAdmin", "Admin", "Doctor", "Receptionist"]
},
  {
    label: "Logout",
    icon: "fa-solid fa-right-from-bracket",
    roles: ["Admin", "SuperAdmin", "Doctor", "Receptionist"],
    action: "logout"  
  }
];
