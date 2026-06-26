import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Palette, Users, Sparkles, CheckCircle } from 'lucide-react';
import { CreateProjectGroupRequest } from '../types/project-groups';
import { projectGroupService } from '../services/projectGroupService';
import { BannerAd } from '../components/AdSense';
import toast from 'react-hot-toast';

const projectGroupSchema = z.object({
  name: z.string().min(1, 'Project group name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
});

type ProjectGroupFormData = z.infer<typeof projectGroupSchema>;

const COLOR_PRESETS = [
  { color: '#3B82F6', name: 'Ocean Blue' },
  { color: '#10B981', name: 'Emerald Green' },
  { color: '#F59E0B', name: 'Sunset Orange' },
  { color: '#EF4444', name: 'Ruby Red' },
  { color: '#8B5CF6', name: 'Royal Purple' },
  { color: '#06B6D4', name: 'Sky Cyan' },
  { color: '#F97316', name: 'Tangerine' },
  { color: '#84CC16', name: 'Fresh Lime' },
  { color: '#EC4899', name: 'Hot Pink' },
  { color: '#6366F1', name: 'Indigo' },
  { color: '#14B8A6', name: 'Teal' },
  { color: '#F472B6', name: 'Rose' }
];

export const CreateProjectGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProjectGroupFormData>({
    resolver: zodResolver(projectGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6'
    }
  });

  const watchedColor = watch('color');

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  const onSubmit = async (data: ProjectGroupFormData) => {
    try {
      setLoading(true);
      
      const createData: CreateProjectGroupRequest = {
        name: data.name,
        description: data.description,
        color: data.color || '#3B82F6'
      };

      const response = await projectGroupService.createProjectGroup(createData);

      if (response.success) {
        toast.success('Project group created successfully!');
        navigate('/project-groups');
      } else {
        const e = response.error;
        toast.error((typeof e === 'object' ? e?.message : e) || 'Failed to create project group');
      }
    } catch (error: any) {
      console.error('Error creating project group:', error);
      toast.error('Failed to create project group');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/project-groups');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Banner Ad */}
      <BannerAd 
        adSlot="9876543210" 
        className="mb-6"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with Back Button */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={handleCancel}
            className="group flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create Project Group
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Organize your projects with style and efficiency
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Project Group Name */}
                <div className="space-y-3">
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Project Group Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      {...register('name')}
                      className="w-full px-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="e.g., E-Commerce Platform, Blog System, Mobile App Suite"
                    />
                    {watch('name') && (
                      <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.name && (
                    <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    className="w-full px-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Describe what this project group encompasses and its main purpose..."
                  />
                  {errors.description && (
                    <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Color Selection */}
                <div className="space-y-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Palette className="w-4 h-4 text-blue-500" />
                    Choose Your Color Theme
                  </label>
                  
                  {/* Color Presets Grid */}
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Popular color themes:</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => handleColorSelect(preset.color)}
                          className={`group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                            selectedColor === preset.color 
                              ? 'bg-white shadow-lg scale-105 ring-2 ring-blue-500/30' 
                              : 'bg-white/50 hover:bg-white hover:shadow-md'
                          }`}
                          title={preset.name}
                        >
                          <div 
                            className={`w-8 h-8 rounded-lg shadow-sm transition-all duration-200 ${
                              selectedColor === preset.color ? 'scale-110' : 'group-hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-xs text-gray-600 mt-1 text-center leading-tight">
                            {preset.name}
                          </span>
                          {selectedColor === preset.color && (
                            <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Input */}
                  <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Custom color:</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        {...register('color')}
                        className="w-12 h-12 border-2 border-white rounded-xl cursor-pointer shadow-sm"
                        onChange={(e) => handleColorSelect(e.target.value)}
                      />
                      <input
                        type="text"
                        {...register('color')}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        placeholder="#3B82F6"
                      />
                    </div>
                    {errors.color && (
                      <p className="flex items-center gap-2 text-sm text-red-600">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.color.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Create Project Group
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Live Preview */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Preview
                </h3>
                <div 
                  className="p-4 rounded-xl border-l-4 transition-all duration-300"
                  style={{ 
                    borderLeftColor: watchedColor || selectedColor,
                    backgroundColor: `${watchedColor || selectedColor}10`
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: watchedColor || selectedColor }}
                    />
                    <h4 
                      className="font-semibold text-lg"
                      style={{ color: watchedColor || selectedColor }}
                    >
                      {watch('name') || 'Your Project Group Name'}
                    </h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {watch('description') || 'Your project group description will appear here...'}
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Choose colors that reflect your project's purpose
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Keep names concise but descriptive
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Add detailed descriptions for team clarity
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};