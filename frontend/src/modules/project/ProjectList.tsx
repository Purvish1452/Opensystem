import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';

const ProjectList = () => {
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getProjects(1, 10),
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-500">Failed to load projects. {(error as any)?.message}</div>;
    }

    const projects = response?.data?.projects || [];

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold dark:text-white">Active Projects</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project._id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-md transition bg-white dark:bg-dark-surface cursor-pointer">
                        <h2 className="font-semibold text-lg dark:text-gray-100">{project.title}</h2>
                        <p className="text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                        <div className="mt-4 flex gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                {project.status}
                            </span>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No projects found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
