import React, { useEffect, useState } from "react";
import { Plus, Book, Users, MessageCircle, Search } from "lucide-react";
import { api } from "../../axios";
import AddStudentForm from "./AddStudentForm";
import EditStudentModal from "./EditStudentModal";
import AssignLessonModal from "./AssignLessonModal";
import StudentDetailsModal from "./StudentDetailsModal";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAssignLesson, setShowAssignLesson] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [filterText, setFilterText] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.getStudents();
      const list = Array.isArray(response) ? response : response.students || [];
      setStudents(list);
    } catch (error) {
      console.error("Error loading students:", error);
      alert("Error loading students");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name}?`)) return;
    try {
      const response = await api.deleteStudent(student.phone);
      if (response.success) {
        alert("Student deleted successfully");
        loadStudents();
      } else {
        alert("Failed to delete student.");
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
  };

  const handleViewStudentLessons = async (student) => {
    try {
      const response = await api.getStudent(student.phone);
      // assuming response = { student: {...}, lessons: [...] }
      setStudentDetails(response);
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      student.email?.toLowerCase().includes(filterText.toLowerCase())
  );

  const renderContent = () => {
    if (activeTab === "students") {
      return (
        <div className="flex-1 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-800">
              {students.length} Students
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddStudent(true)}
                className="bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white flex items-center gap-2"
              >
                <Plus size={16} />
                Add Student
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {filterText
                    ? "No students match your search."
                    : "No students found. Use 'Add Student' button to add new students."}
                </p>
                {!filterText && (
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Student
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.phone} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleViewStudentLessons(student)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          View Lessons
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "lessons") {
      return (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage Lessons</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Create and manage lessons for your students.</p>
            <button
              onClick={() => setShowAssignLesson(true)}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 mx-auto"
            >
              <Book size={20} />
              Assign Lesson
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "messages") {
      return (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage Messages</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">View and manage messages with students.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="w-20 h-12 bg-gray-200 rounded mb-8"></div>
        </div>
        <nav className="mt-8">
          {["students", "lessons", "messages"].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium cursor-pointer border-r-4 ${
                activeTab === tab
                  ? "bg-blue-50 text-blue-700 border-blue-500"
                  : "text-gray-600 border-transparent hover:bg-gray-50"
              }`}
            >
              Manage {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Modals */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddStudentForm
            onStudentAdded={loadStudents}
            onClose={() => setShowAddStudent(false)}
          />
        </div>
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onSave={loadStudents}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {showAssignLesson && (
        <AssignLessonModal
          students={students}
          onAssign={loadStudents}
          onClose={() => setShowAssignLesson(false)}
        />
      )}

      {studentDetails && (
        <StudentDetailsModal
          student={studentDetails.student}
          lessons={studentDetails.lessons}
          onClose={() => setStudentDetails(null)}
        />
      )}
    </div>
  );
}
