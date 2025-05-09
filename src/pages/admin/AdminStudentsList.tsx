import React, { useEffect, useState } from "react";
import { useStudentStore } from "../../store/studentStore";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Search, School, User, Mail, Hash } from "lucide-react";

const AdminStudentsList: React.FC = () => {
  const { students, fetchStudents, searchStudents } = useStudentStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchStudents();
      setLoading(false);
    };

    loadData();
  }, [fetchStudents]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        setSearchLoading(true);
        searchStudents(searchQuery).finally(() => setSearchLoading(false));
      } else {
        fetchStudents();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, searchStudents, fetchStudents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
        <p className="mt-1 text-gray-500">
          View and search all students in the system
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="relative">
            <Input
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              placeholder="Search by name, email, USN, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center bg-white rounded-lg border border-gray-200 py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No matching students
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No students yet
              </h3>
              <p className="text-gray-500">
                Students will appear here once they register.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {students.map((student) => (
              <Card
                key={student.id}
                className="transform transition hover:shadow-md"
              >
                <CardHeader className="bg-gray-50 flex items-center space-x-3 py-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {student.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {student.student_profile?.semester || "-"} Semester
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-700 truncate">
                        {student.email}
                      </span>
                    </div>

                    {student.student_profile && (
                      <>
                        <div className="flex items-center text-sm">
                          <Hash className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700">
                            {student.student_profile.usn}
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <School className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 truncate">
                            {student.student_profile.college_name}
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <div className="h-4 w-4 text-gray-400 mr-2 flex items-center justify-center">
                            <span className="text-xs font-medium">S</span>
                          </div>
                          <span className="text-gray-700">
                            Section {student.student_profile.section}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsList;
