import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../../axios";

export default function AssignLessonModal({ students, onAssign, onClose }) {
    const [formData, setFormData] = useState({
        studentPhone: '',
        title: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        setLoading(true);

        try {
            const response = await api.assignLesson(formData);
            if (response.success) {
                onAssign?.();
                onClose();
            } else {
                alert("Failed to assign lesson.");
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        } finally {
            setLoading(false);
        }
    };
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-gray-800">Assign Lesson</h2>
               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                   <X size={20} />
               </button>
           </div>

           <div className="space-y-4">
               <div>
                   <select
                       value={formData.studentPhone}
                       onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                       className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                   >
                       <option value="">Select Student</option>
                       {students.map((student) => (
                           <option key={student.phone} value={student.phone}>
                               {student.name}
                           </option>
                       ))}
                   </select>
               </div>

               <div>
                   <input
                       type="text"
                       value={formData.title}
                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                       placeholder="Lesson Title"
                       className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                   />
               </div>

               <div>
                   <textarea
                       value={formData.description}
                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                       placeholder="Lesson Description"
                       className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                   />
               </div>

               <div className="flex gap-2">
                   <button
                       onClick={onClose}
                       className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                   >
                       Cancel
                   </button>
                   <button
                       onClick={handleSubmit}
                       disabled={loading}
                       className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                   >
                       {loading ? "Assigning..." : "Assign"}
                   </button>
               </div>
           </div>
        </div>
    </div>
    
    )
}