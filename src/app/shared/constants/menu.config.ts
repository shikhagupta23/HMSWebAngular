export interface MenuItem {
  label: string;
  icon: string;
  route?: string;     
  roles: string[];
  hidden?: boolean;
  action?: string;     
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "fa-solid fa-shapes",
    route: "/doctor",
    roles: ["Admin", "SuperAdmin", "Doctor", "Receptionist"]
  },
  {
    label: "Today's Appointments",
    icon: "fa-solid fa-calendar-days",
    route: "/doctor/appointment/todayappointments",
    roles: ["Doctor", "Receptionist"]
  },
  {
    label: "All Appointments",
    icon: "fa-solid fa-calendar-check",
    route: "/doctor/appointment/allappointments",
    roles: ["Doctor", "Receptionist"]
  },
  {
    label: "My Patients",
    icon: "fa-solid fa-user-injured",
    route: "/doctor/patient/allpatient",
    roles: ["Doctor", "Receptionist"]
  },
  {
    label: "Prescriptions",
    icon: "fa-solid fa-file-medical",
    route: "/doctor/prescription/add",
    roles: ["Doctor", "Receptionist"]
  },
  {
    label: "Medicines",
    icon: "fas fa-pills",
    route: "/doctor/medicine/allmedicine",
    roles: ["Doctor", "Receptionist"]
  },
  {
    label: "Lab Tests",
    icon: "fa-solid fa-flask-vial",
    route: "/doctor/labtest/alllabtest",
    roles: ["Doctor", "Receptionist"]
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
    route: "demo",
    roles: ["SuperAdmin"]
  },
  {
    label: "Feature",
    icon: "fa-solid fa-wrench",
    route: "demo",
    roles: ["SuperAdmin"]
  },
 
  {
  label: "Logout",
  icon: "fa-solid fa-right-from-bracket",
  roles: ["Admin", "SuperAdmin", "Doctor", "Receptionist"],
  action: "logout"  
}
];
