
const AdminDashboard = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-4">Admin Control Panel</h1>
            <p className="text-gray-600">This route is protected by RoleGuard.</p>
        </div>
    );
};

export default AdminDashboard;
