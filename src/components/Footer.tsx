import NextLink from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-sm-black text-white">
      <div className="container mx-auto px-4 py-4 md:py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <h2 className="mb-4 text-xl font-bold">
              <span className="text-sm-red">SHINING</span> MOTORS
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Your ultimate destination for automotive enthusiasts. From luxury cars to performance parts, 
              we offer a unique social shopping experience.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-sm-red">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-sm-red">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-sm-red">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-sm-red">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 justify-between ">
            <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li><NextLink href="/" className="text-gray-400 hover:text-sm-red">Home</NextLink></li>
              <li><NextLink href="/social" className="text-gray-400 hover:text-sm-red">Social Media Wall</NextLink></li>
              <li><NextLink href="/shop" className="text-gray-400 hover:text-sm-red">Shop</NextLink></li>
              <li><NextLink href="/vehicles" className="text-gray-400 hover:text-sm-red">Vehicles</NextLink></li>
              <li><NextLink href="/services" className="text-gray-400 hover:text-sm-red">Services</NextLink></li>
              <li><NextLink href="/events" className="text-gray-400 hover:text-sm-red">Events</NextLink></li>
              <li><NextLink href="/sim-racing" className="text-gray-400 hover:text-sm-red">Sim Racing</NextLink></li>
              <li><NextLink href={"/moto-revolution" as any} className="text-gray-400 hover:text-sm-red">Moto Revolution</NextLink></li>
           
            </ul>
            </div>
            <div>
            <h3 className="mb-4 font-semibold">Categories</h3>
            <ul className="space-y-2">
              <li><NextLink href="/shop/category/oem-parts" className="text-gray-400 hover:text-sm-red">OEM Parts</NextLink></li>
              <li><NextLink href="/shop/category/performance-racing-parts" className="text-gray-400 hover:text-sm-red">Performance Parts</NextLink></li>
              <li><NextLink href="/vehicles/category/new-luxury-supercars" className="text-gray-400 hover:text-sm-red">Luxury Cars</NextLink></li>
              <li><NextLink href="/vehicles/category/performance-racing" className="text-gray-400 hover:text-sm-red">Racing Cars</NextLink></li>
            </ul>
          </div>
          </div>
          
          
          
          <div>
            <h3 className="mb-4 font-semibold">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <Mail size={16} className="mr-2" />
                <span>info@shiningmotors.com</span>
              </li>
              <li className="flex items-center text-gray-400">
                <Phone size={16} className="mr-2" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Shining Motors. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
