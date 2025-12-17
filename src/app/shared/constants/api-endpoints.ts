import { environment } from '../../../environment/environment.delvelopment';

const API_BASE_URL = environment.baseUrl;

export const ApiEndpoints = {
  HOSPITAL: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/HospitalAPI/Get?page=${page}&pageSize=${pageSize}&searchTerm=${search}`,
    ADD: `${API_BASE_URL}/HospitalAPI/Post`,
  },
  User: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/ApplicationUserAPI/Get?page=${page}&pageSize=${pageSize}&searchTerm=${search}`,
    ADD: `${API_BASE_URL}/ApplicationUserAPI/CreateUser`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/Auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  },
  APPOINTMENT: {
    GET: `${API_BASE_URL}/AppointmentAPI/Get`,
    POST: `${API_BASE_URL}/AppointmentAPI/POST`,
    UPCOMING_FOLLOWUP: (
      page: number,
      pageSize: number,
      search: string,
      status: number,
      date: string,
      todays: number
    ) =>
      `${API_BASE_URL}/AppointmentAPI/getUpcomingFollowUpAppointment?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search || '')}&status=${status}&date=${encodeURIComponent(date || '')}&todays=${encodeURIComponent(todays ?? '')}`,
    UPCOMING_FOLLOWUP_BASE: `${API_BASE_URL}/AppointmentAPI/getUpcomingFollowUpAppointment`,
    PAST_FOLLOWUP_BASE: `${API_BASE_URL}/AppointmentAPI/getPastFollowUpAppointment`
  },
  PATIENT: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/SelectAPI/getUserList?role=patient&page=${page}&pageSize=${pageSize}&searchTerm=${search}`,
    GET_BY_NAME_OR_PHONE: `${API_BASE_URL}/SelectAPI/getUserListbyTerm`,
  },
  USER: {
    GET_ROLE_ID: (roleName?: string) =>
      `${API_BASE_URL}/ApplicationUserAPI/getRoleId${
        roleName ? '?roleName=' + encodeURIComponent(roleName) : ''
      }`,

    CREATE: `${API_BASE_URL}/ApplicationUserAPI/CreateUser`,
    CHANGE_PASSWORD: `${API_BASE_URL}/ApplicationUserAPI/ChangePassword`,
  },
  MEDICINE: {
    GET: `${API_BASE_URL}/MedicineAPI/getMedicineAsPerHospitalId`,

    GET_MEDICINE_TYPE: `${API_BASE_URL}/MedicineAPI/getMedicineType`,

    POST: `${API_BASE_URL}/MedicineAPI/Post`,
  },
  LABTEST: {
    GET: `${API_BASE_URL}/LabTest/Get`,
  },

  DOCTOR: {
    GET: `${API_BASE_URL}/SelectAPI/getUserList?role=doctor`,
    GETFee: `${API_BASE_URL}/DoctorAPI/getDoctorFee?DoctorId=`,
    GetPatientAsPerDoctor: `${API_BASE_URL}/DoctorAPI/getPatientAsPerDoctorId`,
    GetAllPatientAsPerDoctor: `${API_BASE_URL}/DoctorAPI/getALLPatientByDoctorId`,
    GetDoctorById: `${API_BASE_URL}/DoctorAPI/getDoctorsById?id=`,
    GetMedicineType: `${API_BASE_URL}/MedicineAPI/getMedicineType`,
    GetMedicineList: `${API_BASE_URL}/MedicineAPI/getMedicine?medicineTypeId=`,
    GetLabTest: `${API_BASE_URL}/LabTest/getLabTest`,
    GetFrequency: `${API_BASE_URL}/DoctorAPI/getMedicineFrequency`,
    GetMedicineTimings: `${API_BASE_URL}/DoctorAPI/getMedicineTiming`,
    GetMedicineInstructions: `${API_BASE_URL}/DoctorAPI/getMedicineInstruction`,
    SavePrescription: `${API_BASE_URL}/DoctorAPI/savePrescription`,
    GetPrescriptionByAppointmentId: `${API_BASE_URL}/DoctorAPI/getPrescription`,
    UpdateAppointment: `${API_BASE_URL}/Hub/UpdateAppointmentStatus`,
  },
  DASHBOARD: {
    GETDASHBOARDDATA: `${API_BASE_URL}/DashboardAPI/todayappointments`,
  },

  PROFILE: {
    GETPROFILE: `${API_BASE_URL}/ProfileAPI/getProfile`,
    UPDATEPROFILE: `${API_BASE_URL}/ProfileAPI/updateProfile`,
  },

  PRESCRIPTION: {
    GET_MASTER: `${API_BASE_URL}/SelectAPI/getPrescriptionHelperMaster`,
    GET_VALUES: `${API_BASE_URL}/PrescriptionApi/getPrescriptionHelperValues/`, // + masterId
  },
  FEATURE: {
    GET: (page: number, pageSize: number, search?: string) =>
      `${API_BASE_URL}/FeatureAPI/getFeatures?page=${page}&pageSize=${pageSize}${
        search ? '&searchTerm=' + encodeURIComponent(search) : ''
      }`,
    SAVE: `${API_BASE_URL}/FeatureAPI/save`,
  },
  FEATURE_ACCESS: {
    GET: (page: number, pageSize: number, search?: string) =>
      `${API_BASE_URL}/FeatureAccessAPI/getFeatureAccess?page=${page}&pageSize=${pageSize}${
        search ? '&searchTerm=' + encodeURIComponent(search) : ''
      }`,
    SAVE: `${API_BASE_URL}/FeatureAccessAPI/saveFeatureAccess`,
    UPDATE_STATUS: `${API_BASE_URL}/FeatureAccessAPI/updateStatus`,
  },
  SELECT: {
    GET_FEATURE_LIST: `${API_BASE_URL}/SelectAPI/getFeatureList`,
    GET_SYSTEM_ROLE: `${API_BASE_URL}/SelectAPI/getSystemRole`,
    GET_USER_LIST: (role: string, page: number, pageSize: number, search?: string) =>
      `${API_BASE_URL}/SelectAPI/getUserList?role=${role}&page=${page}&pageSize=${pageSize}${
        search ? '&searchTerm=' + encodeURIComponent(search) : ''
      }`,
  },
};
