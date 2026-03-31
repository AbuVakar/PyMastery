import React, { useState } from 'react';

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  experience: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  expertise: string[];
  languages: string[];
  availability: string;
  bio: string;
}

interface MentorshipProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  level: string;
  features: string[];
  mentor: Mentor;
  nextSession: string;
  enrolled: number;
}

const MentorshipProgram: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<string>('career');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      title: 'Senior Software Engineer',
      company: 'Google',
      experience: '8+ years',
      rating: 4.9,
      students: 245,
      price: 2999,
      image: '👨‍💼',
      expertise: ['System Design', 'Algorithms', 'Cloud Architecture', 'Java', 'Python'],
      languages: ['English', 'Hindi'],
      availability: 'Weekend & Evening',
      bio: 'Passionate about helping developers grow their careers through practical guidance and real-world insights.'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      title: 'Frontend Architect',
      company: 'Microsoft',
      experience: '6+ years',
      rating: 4.8,
      students: 189,
      price: 2499,
      image: '👩‍💼',
      expertise: ['React', 'TypeScript', 'UI/UX', 'Performance Optimization'],
      languages: ['English', 'Hindi'],
      availability: 'Flexible',
      bio: 'Specialized in frontend development and helping students build modern, scalable applications.'
    },
    {
      id: '3',
      name: 'Amit Patel',
      title: 'DevOps Engineer',
      company: 'Amazon',
      experience: '7+ years',
      rating: 4.7,
      students: 156,
      price: 2799,
      image: '👨‍🔧',
      expertise: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux'],
      languages: ['English', 'Gujarati'],
      availability: 'Weekdays',
      bio: 'Expert in DevOps practices and cloud infrastructure, helping students master deployment strategies.'
    },
    {
      id: '4',
      name: 'Neha Gupta',
      title: 'Data Scientist',
      company: 'Meta',
      experience: '5+ years',
      rating: 4.9,
      students: 203,
      price: 3299,
      image: '👩‍🔬',
      expertise: ['Machine Learning', 'Python', 'Statistics', 'Deep Learning'],
      languages: ['English', 'Hindi'],
      availability: 'Evening',
      bio: 'Data science expert passionate about teaching AI/ML concepts and practical applications.'
    },
    {
      id: '5',
      name: 'Vikram Singh',
      title: 'Mobile Developer',
      company: 'Uber',
      experience: '6+ years',
      rating: 4.8,
      students: 167,
      price: 2699,
      image: '👨‍💻',
      expertise: ['iOS', 'Android', 'React Native', 'Flutter'],
      languages: ['English', 'Hindi'],
      availability: 'Weekend',
      bio: 'Mobile development specialist helping students create amazing mobile applications.'
    },
    {
      id: '6',
      name: 'Anjali Reddy',
      title: 'Backend Engineer',
      company: 'Netflix',
      experience: '7+ years',
      rating: 4.9,
      students: 198,
      price: 2899,
      image: '👩‍💻',
      expertise: ['Node.js', 'Python', 'Microservices', 'Database Design'],
      languages: ['English', 'Telugu'],
      availability: 'Flexible',
      bio: 'Backend architecture expert helping students build scalable server-side applications.'
    }
  ];

  const programs: MentorshipProgram[] = [
    {
      id: 'career',
      title: 'Career Guidance',
      description: 'Get personalized career advice and roadmap planning',
      duration: '3 months',
      price: 8999,
      level: 'Beginner to Advanced',
      features: [
        '1-on-1 career planning sessions',
        'Resume and portfolio review',
        'Interview preparation',
        'Job application strategies',
        'Industry insights',
        'Networking guidance'
      ],
      mentor: mentors[0],
      nextSession: 'Tomorrow, 6:00 PM',
      enrolled: 89
    },
    {
      id: 'technical',
      title: 'Technical Skills',
      description: 'Master specific technical skills with expert guidance',
      duration: '6 months',
      price: 14999,
      level: 'Intermediate',
      features: [
        'Personalized learning path',
        'Code reviews and feedback',
        'Project-based learning',
        'Best practices guidance',
        'Performance optimization',
        'Industry standards'
      ],
      mentor: mentors[1],
      nextSession: 'Monday, 7:00 PM',
      enrolled: 67
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      description: 'Comprehensive interview preparation with mock interviews',
      duration: '2 months',
      price: 5999,
      level: 'All Levels',
      features: [
        'Mock interviews with feedback',
        'Technical question practice',
        'Behavioral interview prep',
        'Company-specific preparation',
        'Salary negotiation tips',
        'Follow-up strategies'
      ],
      mentor: mentors[2],
      nextSession: 'Today, 8:00 PM',
      enrolled: 124
    }
  ];

  const currentProgram = programs.find(p => p.id === selectedProgram);

  const handleBookSession = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
  };

  const handleEnrollProgram = (program: MentorshipProgram) => {
    alert(`Enrolled in ${program.title} program! You will receive a confirmation email shortly.`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    if (availability.includes('Flexible')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (availability.includes('Weekend')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mentorship Programs
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Learn from industry experts and accelerate your career growth
          </p>
        </div>

        {/* Programs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose Your Program</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program.id}
                onClick={() => setSelectedProgram(program.id)}
                className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                  selectedProgram === program.id
                    ? 'border-purple-400 shadow-xl ring-2 ring-purple-400'
                    : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{program.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(program.level)}`}>
                    {program.level}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">{program.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{program.price}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/{program.duration}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Next Session</p>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{program.nextSession}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {program.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-purple-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-sm">
                      {program.mentor.image}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{program.mentor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{program.mentor.company}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnrollProgram(program);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Program Details */}
        {currentProgram && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProgram.title} Program</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(currentProgram.level)}`}>
                {currentProgram.level}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Features</h3>
                <div className="space-y-3">
                  {currentProgram.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm">
                        ✓
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Program Duration</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{currentProgram.duration}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Price</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{currentProgram.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Students Enrolled</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{currentProgram.enrolled}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Mentor</h3>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl">
                      {currentProgram.mentor.image}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">{currentProgram.mentor.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{currentProgram.mentor.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentProgram.mentor.company}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Experience</span>
                      <span className="font-medium text-gray-900 dark:text-white">{currentProgram.mentor.experience}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Rating</span>
                      <span className="font-medium text-gray-900 dark:text-white">⭐ {currentProgram.mentor.rating}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Students</span>
                      <span className="font-medium text-gray-900 dark:text-white">{currentProgram.mentor.students}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Availability</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(currentProgram.mentor.availability)}`}>
                        {currentProgram.mentor.availability}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookSession(currentProgram.mentor)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Book Session - ₹{currentProgram.mentor.price}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Mentors Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Mentors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl">
                    {mentor.image}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{mentor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{mentor.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mentor.company}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">⭐ {mentor.rating}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Students</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{mentor.students}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Experience</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{mentor.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Languages</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{mentor.languages.join(', ')}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        +{mentor.expertise.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{mentor.bio}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">₹{mentor.price}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/session</span>
                  </div>
                  <button
                    onClick={() => handleBookSession(mentor)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedMentor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Book Session with {selectedMentor.name}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Time</label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white">
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                    <option>5:00 PM</option>
                    <option>6:00 PM</option>
                    <option>7:00 PM</option>
                    <option>8:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white">
                    <option>Career Guidance (1 hour)</option>
                    <option>Technical Review (1 hour)</option>
                    <option>Interview Prep (1 hour)</option>
                    <option>Project Review (1 hour)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Notes</label>
                  <textarea
                    placeholder="What would you like to discuss?"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Session Fee</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{selectedMentor.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">1 hour</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Session booked with ${selectedMentor.name}! You will receive a confirmation email.`);
                    setShowBookingModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipProgram;
