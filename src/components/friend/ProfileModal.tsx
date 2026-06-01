import {
    X,
    Mail,
    Phone,
    MapPin,
    Gift,
    Calendar,
    Edit2,
    MailIcon,
} from 'lucide-react';

interface User {
    name: string;
    email: string;
    bio: string;
    coverImage: string;
    avatar: string;
    address: string;
    birthdate: string;
    joined: string;
    interests: string[];
    stats: {
        friends: string;
        photos: string;
        videos: string;
    };
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User;
}

const defaultUser: User = {
    name: 'ThankZang',
    email: 'hhhhttt@gmail.com',
    bio: 'Exploring the intersection of design and technology. Creating minimalist experiences.',
    coverImage:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ckwVnuZo6vXkCKHII2HuG9paomydT6eRVkB0xPR_C4w1xbf_hfUhAu31Z8nRJa0XX78Izii2dhYWgrw8AtU8GVgmcxQQ9PwM616h7f1oTkKcM6qBNoQQQAen9FAksGS7J7AwF4YPGIWPaBwH_BSTsR0HmjixB-gjfv4l0G8Co1OQEDc_BNsMo7sljmm9Td-wkuMVff13ec5qTgMgmpezusJovOC3__IyZkTuZ0ac9lEV_Wnf6Wsi3tZ5Kg4h6ZzoEg4QsfRYnJes',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUj1Spfodjy9TvQFYvQapp0gi2rm0Qzvt6NF83DBQLLgtRESzvtGr1rJf5HusHmzemLvajHPKNzO2V5YfuXT4TUJ-bsEtGBmW52fNDtzGXa7PUloWDLwAILsbyw3uAYUyw8nF6TJveyRz5FjjiOeb3QPo_Jehn6ijPzRpOOf1f9qORwRKgoP3dy1dZMKIc3gHdKodGOyZAAlmE0XiPb7LgZBs-aKIgMujUzYau4-e2iXRcg0a5_K9jYJi6Hf2hd0x5E61BvZk0fDf6',
    address: 'San Francisco, CA',
    birthdate: 'July 12th, 1995',
    joined: 'Joined May 2021',
    interests: [
        'Minimalist Design',
        'UX Research',
        'Photography',
        'Architecture',
        'Tech Ethics',
    ],
    stats: {
        friends: '1.2k',
        photos: '450',
        videos: '85',
    },
};

export default function ProfileModal({
    isOpen,
    onClose,
    user = defaultUser,
}: ProfileModalProps) {
    if (!isOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal panel */}
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 shadow transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Cover Image */}
                <div className="h-36 w-full overflow-hidden rounded-t-2xl">
                    <img
                        src={user.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-14 relative z-10 mb-4">
                    <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                        <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Name & Bio */}
                <div className="text-center px-6">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-xl font-bold text-[#006275]">
                            {user.name}
                        </h1>
                        <button className="text-[#006275] hover:text-[#004d5e] transition-colors">
                            <Edit2 size={16} />
                        </button>
                    </div>
                    <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                        {user.bio}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-5 px-6">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-green-primary hover:bg-white hover:text-green-primary hover: border border-green-primary text-white rounded-full h-10 text-sm font-medium transition-colors">
                        <Mail size={16} />
                        Message
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 border border-green-primary text-green-primary hover:bg-green-primary hover:text-white rounded-full h-10 text-sm font-medium transition-colors">
                        <Phone size={16} />
                        Call
                    </button>
                </div>

                {/* Stats */}
                <div className="flex justify-around mt-6 py-5 border-t border-b border-gray-100 mx-6">
                    <div className="text-center">
                        <p className="font-bold text-xl text-gray-900">
                            {user.stats.friends}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 font-semibold tracking-wider">
                            FRIENDS
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-xl text-gray-900">
                            {user.stats.photos}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 font-semibold tracking-wider">
                            PHOTOS
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-xl text-gray-900">
                            {user.stats.videos}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 font-semibold tracking-wider">
                            VIDEOS
                        </p>
                    </div>
                </div>

                {/* Interests */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-bold text-gray-500 mb-3 text-xs tracking-widest">
                        INTERESTS
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {user.interests.map((item, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 rounded-full border border-green-border-heavy bg-green-bg-light text-green-primary font-medium text-xs transition-colors"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div className="px-6 py-5">
                    <h2 className="font-bold text-gray-500 mb-4 text-xs tracking-widest">
                        DETAILS
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <MapPin
                                size={18}
                                className="text-green-primary shrink-0"
                            />
                            <div>
                                <p className="text-gray-800 font-medium text-sm">
                                    {user.address}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Current Location
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Gift
                                size={18}
                                className="text-green-primary shrink-0"
                            />
                            <div>
                                <p className="text-gray-800 font-medium text-sm">
                                    {user.birthdate}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Birthday
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar
                                size={18}
                                className="text-green-primary shrink-0"
                            />
                            <div>
                                <p className="text-gray-800 font-medium text-sm">
                                    {user.joined}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Member Status
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MailIcon
                                size={18}
                                className="text-green-primary shrink-0"
                            />
                            <div>
                                <p className="text-gray-800 font-medium text-sm">
                                    {user.email}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Mail address
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
