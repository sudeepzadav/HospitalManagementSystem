import { features } from "../constant/whyUs";

export default function WhyUs() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Why Choose Us
          </span>

          <h2 className="text-4xl font-bold text-gray-800 mt-3">
            Smart Hospital Management Solution
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mt-4">
            Our Hospital Management System simplifies healthcare operations by
            providing secure, efficient, and user-friendly tools for hospitals,
            clinics, doctors, and administrative staff.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 text-center border border-gray-100 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-5">
                  <Icon className={`text-4xl ${feature.color}`} />
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        {/* Why us */}
        <section id="why" className="bg-[#F5F8F6] border-y border-[#DDE6E2]">
          <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold mb-1.5">
                Accredited care
              </h3>
              <p className="text-sm text-[#4A6B62] leading-relaxed">
                JCI and ISO 9001 certified, with outcomes reviewed against
                national benchmarks.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1.5">
                Same-week appointments
              </h3>
              <p className="text-sm text-[#4A6B62] leading-relaxed">
                Most specialties offer openings within five business days of
                your request.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1.5">
                One connected record
              </h3>
              <p className="text-sm text-[#4A6B62] leading-relaxed">
                Every visit, test, and prescription is visible to your full care
                team automatically.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
