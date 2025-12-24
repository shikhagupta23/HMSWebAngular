import { environment } from '../../../environment/environment.delvelopment';

const API_BASE_URL = environment.baseUrl;

export const ApiEndpoints = {
  HOSPITAL: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/HospitalAPI/Get?page=${page}&pageSize=${pageSize}&searchTerm=${search}`,
    ADD: `${API_BASE_URL}/HospitalAPI/Post`,
    UPDATE: `${API_BASE_URL}/HospitalAPI/Put`,
    UPDATE_STATUS: `${API_BASE_URL}/HospitalAPI/update-hospital-status`
  },
  User: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/ApplicationUserAPI/Get?page=${page}&pageSize=${pageSize}&searchTerm=${search}`,
    ADD: `${API_BASE_URL}/ApplicationUserAPI/CreateUser`,
    UPDATE_STATUS: `${API_BASE_URL}/ApplicationUserAPI/update-user-status`,
    UPDATE: `${API_BASE_URL}/ApplicationUserAPI/UpdateUser`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/Auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
     FORGOT_PASSWORD: `${API_BASE_URL}/Auth/forgotPassword`,
    VERIFY_OTP: `${API_BASE_URL}/Auth/verifyOTP`
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
      `${API_BASE_URL}/AppointmentAPI/getUpcomingFollowUpAppointment?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
        search || ''
      )}&status=${status}&date=${encodeURIComponent(date || '')}&todays=${encodeURIComponent(
        todays ?? ''
      )}`,
    UPCOMING_FOLLOWUP_BASE: `${API_BASE_URL}/AppointmentAPI/getUpcomingFollowUpAppointment`,
    PAST_FOLLOWUP_BASE: `${API_BASE_URL}/AppointmentAPI/getPastFollowUpAppointment`,
  },
  PATIENT: {
    GET: (page: number, pageSize: number, search: string) =>
      `${API_BASE_URL}/SelectAPI/getUserList?role=patient&page=${page}&pageSize=${pageSize}&search=${search}`,
    GET_BY_NAME_OR_PHONE: `${API_BASE_URL}/SelectAPI/getUserListbyTerm`,
    GETPATIENTAPPOINTMENTLISTS: `${API_BASE_URL}/AppointmentAPI/getPatientAppointmentHistoryByPatientId`
  },
  USER: {
    GET_ROLE_ID: (roleName?: string) =>
      `${API_BASE_URL}/ApplicationUserAPI/getRoleId${
        roleName ? '?roleName=' + encodeURIComponent(roleName) : ''
      }`,

    CREATE: `${API_BASE_URL}/ApplicationUserAPI/CreateUser`,
    CHANGE_PASSWORD: `${API_BASE_URL}/ApplicationUserAPI/ChangePassword`,
    GET_BY_HOSPITAL_ID: (hospitalId: string) =>
    `${API_BASE_URL}/ApplicationUserAPI/GetbyHospitalId/${hospitalId}`
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
    GetMedicineType: `${API_BASE_URL}/DrugManagement/getAllDrugType`,
    GetMedicineList: `${API_BASE_URL}/MedicineAPI/getMedicine?medicineTypeId=`,
    GetLabTest: `${API_BASE_URL}/LabTest/getLabTest`,
    GetFrequency: `${API_BASE_URL}/DoctorAPI/getMedicineFrequency`,
    GetMedicineTimings: `${API_BASE_URL}/DoctorAPI/getMedicineTiming`,
    GetMedicineInstructions: `${API_BASE_URL}/DoctorAPI/getMedicineInstruction`,
    SavePrescription: `${API_BASE_URL}/DoctorAPI/savePrescription`,
    GetPrescriptionByAppointmentId: `${API_BASE_URL}/PrescriptionApi/prescription`,
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
    SAVE: `${API_BASE_URL}/PrescriptionApi/savePrescription`
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
    GET_HOSPITAL_LIST: `${API_BASE_URL}/SelectAPI/getHospital?role=admin`,
    GET_FEATURE_LIST: `${API_BASE_URL}/SelectAPI/getFeatureList`,
    GET_SYSTEM_ROLE: `${API_BASE_URL}/SelectAPI/getSystemRole`,
    GET_USER_LIST: (role: string, page: number, pageSize: number, search?: string) =>
      `${API_BASE_URL}/SelectAPI/getUserList?role=${role}&page=${page}&pageSize=${pageSize}${
        search ? '&searchTerm=' + encodeURIComponent(search) : ''
      }`,
    GET_USER_AS_PER_HOSPITAL_FEATURE: (hospitalId: string, featureId: string, role: string) =>
      `${API_BASE_URL}/SelectAPI/getUserAsPerHospitalId` +
      `?hospitalId=${hospitalId}` +
      `&featureId=${featureId}` +
      `&role=${role}`,
  },
    DRUG: {
    SEARCH_BY_NAME: `${API_BASE_URL}/DrugManagement/getDrugByName`,
    GET_DETAILS: `${API_BASE_URL}/DrugManagement/getMedicineDetails`,
  },
   LAB_TEST: {
    GET: (page: number, pageSize: number) =>
      `${API_BASE_URL}/LabTest/Get?page=${page}&pageSize=${pageSize}`,

    ADD: `${API_BASE_URL}/LabTest/Post`,

    UPDATE: `${API_BASE_URL}/LabTest/Put`,

    DELETE: (id: string) =>
      `${API_BASE_URL}/LabTest/Delete?id=${id}`,
  },
};
