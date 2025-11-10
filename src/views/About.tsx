import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Award, Users, Calendar, Wrench, Star } from "lucide-react";

const About = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stats = [
    { icon: Users, value: "10K+", label: "Happy Customers" },
    { icon: Calendar, value: "15+", label: "Years Experience" },
    { icon: Wrench, value: "500+", label: "Services Completed" },
    { icon: Star, value: "4.9", label: "Average Rating" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <motion.section 
          className="container mx-auto px-4 py-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-sm-red to-sm-red-light"
            {...fadeInUp}
          >
            Driving Excellence Forward
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
          >
            At Shining Motors, we're more than just a automotive service provider. 
            We're your partners in maintaining and enhancing your vehicle's performance.
          </motion.p>
        </motion.section>

        {/* Stats Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-6 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <stat.icon className="w-8 h-8 text-sm-red mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              Our Core Values
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Excellence",
                  description: "We strive for perfection in every service we provide.",
                  icon: Award,
                },
                {
                  title: "Innovation",
                  description: "Embracing the latest automotive technology and solutions.",
                  icon: Wrench,
                },
                {
                  title: "Customer First",
                  description: "Your satisfaction is our top priority.",
                  icon: Users,
                },
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <value.icon className="w-10 h-10 text-sm-red mb-4" />
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
