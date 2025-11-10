
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface TermsAndConditionsModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  open,
  onAccept,
  onDecline
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="w-6 h-6 mr-2" />
            Terms and Conditions - Vendor Registration
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Vendor Agreement</h3>
              <p className="leading-relaxed">
                By registering as a vendor on Moto Revolution, you agree to comply with all terms and conditions 
                set forth in this agreement. This agreement governs your relationship with Moto Revolution and 
                your use of our platform as a vendor.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Vendor Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and up-to-date business information</li>
                <li>Maintain valid business licenses and certifications</li>
                <li>Ensure all products and services comply with applicable laws</li>
                <li>Respond to customer inquiries in a timely manner</li>
                <li>Honor all sales and service commitments</li>
                <li>Maintain professional conduct at all times</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Platform Usage</h3>
              <p className="leading-relaxed">
                Vendors are granted access to our platform to list products, services, and manage their business 
                presence. This access is subject to our approval and ongoing compliance with these terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Commission and Fees</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Commission rates will be communicated separately</li>
                <li>Payment processing fees may apply</li>
                <li>All fees are subject to change with 30 days notice</li>
                <li>Vendors are responsible for their own tax obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Product and Service Standards</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All listings must be accurate and truthful</li>
                <li>Products must be genuine and as described</li>
                <li>Services must be delivered as promised</li>
                <li>Pricing must be competitive and fair</li>
                <li>Images and descriptions must be original or properly licensed</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Prohibited Activities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Selling counterfeit or illegal products</li>
                <li>Misleading advertising or false claims</li>
                <li>Violating intellectual property rights</li>
                <li>Engaging in unfair competition practices</li>
                <li>Circumventing platform policies</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Account Suspension and Termination</h3>
              <p className="leading-relaxed">
                Moto Revolution reserves the right to suspend or terminate vendor accounts for violations of 
                these terms, poor performance, or any other reason that may harm the platform or its users.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Data Protection and Privacy</h3>
              <p className="leading-relaxed">
                Vendors must comply with all applicable data protection laws and our privacy policy when 
                handling customer data. Personal information must be protected and used only for legitimate 
                business purposes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Intellectual Property</h3>
              <p className="leading-relaxed">
                Vendors retain ownership of their content but grant Moto Revolution a license to use, display, 
                and promote vendor content on the platform. Vendors must respect all intellectual property rights.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Limitation of Liability</h3>
              <p className="leading-relaxed">
                Moto Revolution's liability is limited to the extent permitted by law. Vendors are responsible 
                for their own business operations and customer relationships.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">11. Modifications</h3>
              <p className="leading-relaxed">
                These terms may be updated from time to time. Vendors will be notified of significant changes 
                and continued use of the platform constitutes acceptance of updated terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">12. Contact Information</h3>
              <p className="leading-relaxed">
                For questions about these terms or vendor support, please contact us at:
                <br />
                Email: vendor-support@motorevolution.com
                <br />
                Phone: +91-XXXXXXXXXX
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onAccept} className="bg-red-600 hover:bg-red-700">
            Accept Terms & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsModal;
