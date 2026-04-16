import axios from 'axios'

const TOKEN_KEY = 'cvp_token'
const SESSION_KEY = 'cvp_session'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

client.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || 'Request failed'

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_KEY)
    }

    return Promise.reject(new Error(message))
  },
)

async function request(config) {
  const response = await client.request(config)
  return response.data
}

export async function login(userId, password) {
  const data = await request({
    url: '/auth/login',
    method: 'post',
    data: { userId, password },
  })

  // Note: Storing JWT in localStorage is convenient but vulnerable to XSS.
  // For production, consider using httpOnly cookies instead (requires backend support).
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))

  return data
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export async function getStudents() {
  return request({
    url: '/students',
    method: 'get',
  })
}

export async function createStudent(data) {
  return request({
    url: '/students',
    method: 'post',
    data,
  })
}

export async function deleteStudent(studentId) {
  return request({
    url: `/students/${studentId}`,
    method: 'delete',
  })
}

export async function getCertificates(studentId) {
  return request({
    url: '/certificates',
    method: 'get',
    params: studentId ? { studentId } : undefined,
  })
}

export async function issueCertificate(data) {
  return request({
    url: '/certificates/issue',
    method: 'post',
    data,
  })
}

export async function uploadCertificate(metadata, file) {
  const formData = new FormData()
  formData.append('file', file)
  
  // Append metadata fields
  Object.keys(metadata).forEach(key => {
    formData.append(key, metadata[key])
  })

  return request({
    url: '/certificates/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function verifyCertificate(certId) {
  return request({
    url: `/certificates/verify/${encodeURIComponent(certId)}`,
    method: 'get',
  })
}

export async function verifyUploadedCertificate(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/certificates/verify-upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function getAdminOverview() {
  return request({
    url: '/system/overview',
    method: 'get',
  })
}

export async function getSystemHealth() {
  return request({
    url: '/system/health',
    method: 'get',
  })
}

export async function openCertificateDocument(certificateId) {
  const response = await client.get(`/certificates/document/${encodeURIComponent(certificateId)}`, {
    responseType: 'blob',
  })

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: 'application/pdf' })
  const blobUrl = URL.createObjectURL(blob)

  window.open(blobUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}
