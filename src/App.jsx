import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import {
  GuestsOnly,
  HomeRedirect,
  RequireAuth,
  RequireStudent,
  RequireTeacher,
} from './components/RouteGuards.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import TeacherOverview from './pages/teacher/TeacherOverview.jsx'
import TeacherClasses from './pages/teacher/TeacherClasses.jsx'
import TakeAttendance from './pages/teacher/TakeAttendance.jsx'
import AttendanceHistory from './pages/teacher/AttendanceHistory.jsx'
import TeacherStats from './pages/teacher/TeacherStats.jsx'
import StudentOverview from './pages/student/StudentOverview.jsx'
import StudentHistory from './pages/student/StudentHistory.jsx'
import StudentStats from './pages/student/StudentStats.jsx'

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<GuestsOnly />}>
                  <Route path="/login" element={<Login />} />
                </Route>

                <Route element={<RequireAuth />}>
                  <Route element={<RequireTeacher />}>
                    <Route path="/teacher" element={<Layout role="teacher" />}>
                      <Route index element={<TeacherOverview />} />
                      <Route path="classes" element={<TeacherClasses />} />
                      <Route path="attendance" element={<TakeAttendance />} />
                      <Route path="history" element={<AttendanceHistory />} />
                      <Route path="stats" element={<TeacherStats />} />
                    </Route>
                  </Route>

                  <Route element={<RequireStudent />}>
                    <Route path="/student" element={<Layout role="student" />}>
                      <Route index element={<StudentOverview />} />
                      <Route path="history" element={<StudentHistory />} />
                      <Route path="stats" element={<StudentStats />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<HomeRedirect />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

export default App