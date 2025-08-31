import React, { useState, useEffect } from 'react';
import { Book, Users, Search, Plus, Eye, Trash2, UserCheck, Clock, CheckCircle } from 'lucide-react';

export default function ManageLessonsPage({ students, onAssignLesson, onRefreshData }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadLessons();
  }, [students]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      // Create lessons from student data
      const allLessons = new Map();
      
      students.forEach(student => {
        const studentLessons = student.lessons || [];
        studentLessons.forEach(lesson => {
          if (!allLessons.has(lesson.id)) {
            allLessons.set(lesson.id, {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description || 'No description available'
            });
          }
        });
      });

      setLessons(Array.from(allLessons.values()));
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process lessons to show assignment status
  const processedLessons = lessons.map(lesson => {
    const assignedStudents = students.filter(student => 
      student.lessons?.some(studentLesson => studentLesson.id === lesson.id)
    );
    
    const completedCount = assignedStudents.filter(student =>
      student.lessons?.find(studentLesson => 
        studentLesson.id === lesson.id && studentLesson.completed
      )
    ).length;

    return {
      ...lesson,
      assignedStudents,
      totalAssigned: assignedStudents.length,
      completedCount,
      pendingCount: assignedStudents.length - completedCount
    };
  });

  const filteredLessons = processedLessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'assigned') return matchesSearch && lesson.totalAssigned > 0;
    if (filterStatus === 'unassigned') return matchesSearch && lesson.totalAssigned === 0;
    return matchesSearch;
  });

  const getStatusBadge = (lesson) => {
    if (lesson.totalAssigned === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          Not Assigned
        </span>
      );
    }
    
    if (lesson.completedCount === lesson.totalAssigned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          All Completed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        <UserCheck className="w-3 h-3" />
        In Progress
      </span>
    );
  };

  return (
    <div className="flex-1 px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Lessons</h1>
        <button 
          onClick={onAssignLesson}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={16} />
          Assign Lesson
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
            </div>
            <Book className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-blue-600">
                {processedLessons.filter(l => l.totalAssigned > 0).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Lessons</option>
            <option value="assigned">Assigned Only</option>
            <option value="unassigned">Not Assigned</option>
          </select>
        </div>
        <button
          onClick={onRefreshData}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center">
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? "No lessons match your search." : "No lessons found."}
            </p>
            <button
              onClick={onAssignLesson}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Assign First Lesson
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                      <div className="text-sm text-gray-500">{lesson.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(lesson)}
                  </td>
                  <td className="px-6 py-4">
                    {lesson.totalAssigned === 0 ? (
                      <span className="text-gray-400 text-sm">No students assigned</span>
                    ) : (
                      <div className="space-y-1">
                        {lesson.assignedStudents.slice(0, 3).map(student => {
                          const studentLesson = student.lessons?.find(l => l.id === lesson.id);
                          return (
                            <div key={student.phone} className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{student.name}</span>
                              {studentLesson?.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          );
                        })}
                        {lesson.totalAssigned > 3 && (
                          <span className="text-xs text-gray-500">
                            +{lesson.totalAssigned - 3} more students
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lesson.totalAssigned > 0 ? (
                      <div>
                        <div className="text-green-600 font-medium">
                          {lesson.completedCount}/{lesson.totalAssigned} completed
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${lesson.totalAssigned > 0 ? (lesson.completedCount / lesson.totalAssigned) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                        onClick={() => alert(`View details for: ${lesson.title}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Assign to Students"
                        onClick={onAssignLesson}
                      >
                        <Users size={16} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Lesson"
                        onClick={() => alert(`Delete lesson: ${lesson.title}`)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Cards at Bottom */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Assigned Lesson</h3>
          {processedLessons.length > 0 && (
            <div>
              <p className="font-medium text-blue-600">
                {processedLessons.reduce((max, lesson) => 
                  lesson.totalAssigned > max.totalAssigned ? lesson : max,
                  processedLessons[0]
                ).title}
              </p>
              <p className="text-sm text-gray-500">
                Assigned to {Math.max(...processedLessons.map(l => l.totalAssigned), 0)} students
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Engagement</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Students:</span>
              <span className="text-sm font-medium">
                {students.filter(s => s.lessons?.length > 0).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Students:</span>
              <span className="text-sm font-medium">{students.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Lessons/Student:</span>
              <span className="text-sm font-medium">
                {students.length > 0 ? 
                  Math.round(students.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) / students.length * 10) / 10
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}