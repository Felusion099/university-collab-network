import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { SkillBadge } from '../common/SkillBadge';
import {
  Sparkles,
  Search,
  Clock,
  DollarSign,
  Bookmark,
  Check,
  MessageSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Service } from '../../types';

export const ServiceDiscovery: React.FC = () => {
  const {
    services,
    users,
    currentUser,
    openUserProfile,
    startConversationWithUser,
    setIsServiceCreateOpen,
    toggleSaveItem,
    isItemSaved,
    globalSearch,
    setGlobalSearch,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const categories = [
    'all',
    'Design',
    'Engineering',
    'Hardware & IoT',
    'Research & Writing',
  ];

  const filteredServices = services.filter((s) => {
    // Search
    const term = globalSearch.toLowerCase().trim();
    if (term) {
      const matchTitle = s.title.toLowerCase().includes(term);
      const matchDesc = s.description.toLowerCase().includes(term);
      const matchSkills = s.skills.some((sk) => sk.toLowerCase().includes(term));
      if (!matchTitle && !matchDesc && !matchSkills) {
        return false;
      }
    }

    // Category
    if (selectedCategory !== 'all' && s.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Student & Creator Services
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Hire peer developers, UI designers, hardware specialists, and academic typesetters for your student startup or lab.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            <strong className="text-zinc-900">{filteredServices.length}</strong> services offered
          </span>
          {currentUser.role === 'student' && (
            <button
              onClick={() => setIsServiceCreateOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Publish a Service
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="py-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search services, design, PCB review..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs capitalize font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              {cat === 'all' ? 'All Services' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 mt-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 mt-3">No matching services</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or publish your own student service!
          </p>
          <button
            onClick={() => {
              setGlobalSearch('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredServices.map((service) => {
            const creator = users.find((u) => u.id === service.creatorId) || users[0];
            const isSaved = isItemSaved('service', service.id);
            const isCreator = service.creatorId === currentUser.id;

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Creator Info & Bookmark */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => openUserProfile(creator.id)}
                            className="font-medium text-xs text-zinc-900 hover:underline cursor-pointer"
                          >
                            {creator.name}
                          </span>
                          <VerificationBadge verification={creator.verification} size="sm" />
                        </div>
                        <span className="text-[11px] text-zinc-500 block leading-tight">
                          {creator.department}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSaveItem('service', service.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSaved
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                      }`}
                      title={isSaved ? 'Saved to bookmarks' : 'Save service'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Category Pill */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                      {service.category}
                    </span>
                  </div>

                  {/* Service Title */}
                  <h3
                    onClick={() => setSelectedService(service)}
                    className="text-sm font-semibold text-zinc-900 mt-2 hover:underline cursor-pointer line-clamp-2 leading-snug"
                  >
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 mt-2 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Skills tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {service.skills.slice(0, 3).map((skill) => (
                      <SkillBadge key={skill} skill={skill} size="xs" />
                    ))}
                    {service.skills.length > 3 && (
                      <span className="text-[10px] text-zinc-400 self-center pl-1">
                        +{service.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Actions Footer */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-medium">Starting at</div>
                    <div className="text-sm font-bold text-zinc-900">{service.startingPrice}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 mr-1">
                      <Clock className="w-3 h-3" />
                      {service.turnaround}
                    </span>
                    <button
                      onClick={() => setSelectedService(service)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      View Packages
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Service Detail / Commission Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {selectedService.category}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 mt-2">{selectedService.title}</h2>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 space-y-6">
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1">About This Service</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">{selectedService.description}</p>
              </div>

              {/* Packages Grid */}
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-3">Service Packages & Deliverables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedService.packages.map((pkg, i) => (
                    <div
                      key={pkg.name}
                      className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-zinc-900">{pkg.name}</div>
                        <div className="text-xl font-bold text-zinc-900 mt-2">{pkg.price}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          Delivery in {pkg.deliveryDays} days
                        </div>

                        <ul className="mt-3 space-y-1.5 text-[11px] text-zinc-600">
                          {pkg.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          const seller = selectedService.creatorId;
                          setSelectedService(null);
                          startConversationWithUser(seller);
                        }}
                        className="mt-4 w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium text-center transition-colors"
                      >
                        Select & Inquire
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creator Card */}
              {(() => {
                const creator = users.find((u) => u.id === selectedService.creatorId);
                if (!creator) return null;
                return (
                  <div className="p-4 rounded-xl bg-zinc-100/60 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                      />
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                          {creator.name}
                          <VerificationBadge verification={creator.verification} size="sm" />
                        </div>
                        <div className="text-[11px] text-zinc-500">{creator.headline}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const cid = creator.id;
                        setSelectedService(null);
                        openUserProfile(cid);
                      }}
                      className="text-xs text-zinc-700 hover:text-zinc-900 font-medium underline"
                    >
                      View Profile
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
