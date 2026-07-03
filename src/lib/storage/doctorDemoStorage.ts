export const DOCTOR_DEMO_SELECTED_ID_KEY = 'doctor_demo_selected_id'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function readDoctorDemoSelectedId() {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(DOCTOR_DEMO_SELECTED_ID_KEY)
}

export function writeDoctorDemoSelectedId(medicoId: string) {
  if (!isBrowser()) {
    return medicoId
  }

  window.localStorage.setItem(DOCTOR_DEMO_SELECTED_ID_KEY, medicoId)
  return medicoId
}
