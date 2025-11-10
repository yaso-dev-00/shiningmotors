import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle } from 'lucide-react';

interface VendorOnboardingAgreementProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose:()=>void
}

const VendorOnboardingAgreement: React.FC<VendorOnboardingAgreementProps> = ({
  isOpen,
  onAccept,
  onDecline,
  onClose
}) => {
  return (
    <Dialog open={isOpen}  onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col py-4 px-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Vendor Onboarding Agreement
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 text-sm">
            <div className="text-center text-gray-600 mb-6">
              <p>
                This Vendor Onboarding Agreement ("Agreement") is entered into between{' '}
                <strong>Shining Motors Technologies Pvt. Ltd.</strong> (the "Company") and the person or entity ("Vendor") 
                who accepts these terms electronically. By clicking "Accept" or otherwise indicating agreement, 
                the Vendor acknowledges that this Agreement is a valid and binding contract under Indian law.
              </p>
            </div>

            <section>
              <h3 className="text-lg font-semibold mb-3">1. Definitions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Company:</strong> Shining Motors Technologies Pvt. Ltd., an Indian automotive marketplace platform.</li>
                <li><strong>Vendor:</strong> Any individual or business (including vehicle dealers, parts suppliers, service centers, garages, rental agencies, etc.) that lists products or services on the Company's platform.</li>
                <li><strong>Products:</strong> Any vehicles, parts, accessories, services (e.g. repair, maintenance, rentals) or other offerings sold or provided by the Vendor through the Company's platform.</li>
                <li><strong>Platform:</strong> The Company's website and mobile application (collectively, the "Platform") where products and services are listed and sold.</li>
                <li><strong>GST:</strong> Goods and Services Tax as defined under the Central GST Act, 2017 and related laws in India.</li>
                <li><strong>Order:</strong> A request by a buyer to purchase a Product or Service from the Vendor via the Platform.</li>
                <li><strong>Confidential Information:</strong> Any non-public business, financial, technical or other information of either party marked confidential or that reasonably should be considered confidential.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Appointment and Scope</h3>
              <p>
                The Company hereby authorizes the Vendor to onboard and offer its Products on the Platform subject to the terms of this Agreement. 
                The Vendor is an independent seller and not an agent or employee of the Company. This Agreement governs all transactions and 
                interactions between the Vendor and the Company for the sale of Products on the Platform. The Vendor agrees to comply with these 
                terms and all applicable laws in performing its obligations.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Vendor Eligibility and Onboarding</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Qualifications:</strong> The Vendor represents and warrants that it is duly organized and in good standing under applicable law and has all necessary licenses, permits and registrations to sell its Products. Vendors must hold valid registrations such as a GSTIN, PAN, bank account and other KYC documents (e.g. Aadhar, passport) as required by law and Platform policy. Both individuals and business entities may register as Vendors.</li>
                <li><strong>Onboarding Information:</strong> The Vendor shall provide the Company with accurate and complete registration information, including business name, address, tax identification, bank account details, and contact information. The Vendor must keep this information updated at all times.</li>
                <li><strong>Compliance:</strong> The Vendor agrees to comply with all applicable laws, regulations and policies relevant to its business and to the sale of its Products on the Platform.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Product Listings and Restrictions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Permitted Products:</strong> The Vendor may list only those Products and Services that fall within approved categories and comply with all applicable laws.</li>
                <li><strong>Listing Quality:</strong> The Vendor is solely responsible for the accuracy and quality of its product listings. All information must be truthful and not misleading.</li>
                <li><strong>Removal of Listings:</strong> The Company may remove, suspend or edit any product listing at its discretion, especially if non-compliant with law or Company guidelines.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Pricing, Commission and Payment</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Pricing:</strong> The Vendor sets its own sale price for each Product, which must comply with applicable pricing regulations.</li>
                <li><strong>Commissions and Fees:</strong> For each sale, the Company will charge commissions and service fees as specified by the Company's fee schedule.</li>
                <li><strong>Payment Cycle:</strong> After deducting all fees and taxes, the Company will remit the remaining sale amount to the Vendor's bank account within 7–14 business days.</li>
                <li><strong>Taxes and GST:</strong> The Vendor is solely responsible for complying with all applicable tax laws, including GST compliance and TCS obligations.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Delivery and Fulfillment</h3>
              <p>
                The Vendor is responsible for delivering Products to customers, either directly or through the Company's designated logistics partners. 
                All orders must be shipped within the specified timeframe, with proper packaging and tracking information provided.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Returns, Refunds and Cancellations</h3>
              <p>
                The Vendor shall comply with the Company's published return and refund policies, accepting returns and issuing refunds 
                or replacements as required by law or Company policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Warranties and Service</h3>
              <p>
                The Vendor warrants that all Products sold are free from defects, meet stated specifications, and conform to applicable 
                standards and laws. All warranties required by the Sale of Goods Act, 1930 are provided by the Vendor.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Data Protection and Privacy</h3>
              <p>
                Both parties shall comply with applicable data protection and privacy laws, including the Information Technology Act, 2000 
                and the Digital Personal Data Protection Act, 2023. Appropriate security measures must be implemented to protect personal data.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Intellectual Property Rights</h3>
              <p>
                The Company retains all rights in its intellectual property. The Vendor retains ownership of its products and grants 
                the Company a limited license to display product information for Platform purposes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">11. Indemnification</h3>
              <p>
                The Vendor shall indemnify and hold harmless the Company from all losses, liabilities, and expenses arising from 
                any breach of this Agreement, violation of law, or claims related to the Vendor's products or services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">12. Term, Termination and Suspension</h3>
              <p>
                This Agreement continues until terminated. The Company may suspend or terminate the Agreement at any time, with or without cause. 
                The Vendor may terminate by giving notice through the Platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">13. Dispute Resolution and Governing Law</h3>
              <p>
                This Agreement shall be governed by the laws of India. Any disputes shall be resolved by arbitration in accordance 
                with the Arbitration and Conciliation Act, 1996.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Additional Vendor-Specific Terms</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Auto Dealers:</strong> Must maintain valid trade certificates and dealer licenses as per the Motor Vehicles Act, 1988.</li>
                <li><strong>Service Centers/Mechanics:</strong> Must hold necessary trade licenses and certifications for automotive workshops.</li>
                <li><strong>Parts Suppliers:</strong> Must ensure all parts are genuine, fit for purpose and comply with safety standards.</li>
              </ul>
            </section>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> By accepting this agreement, you acknowledge that you have read, understood, 
                and agree to be bound by all terms and conditions outlined above. This is a legally binding contract 
                under Indian law.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Decline</span>
          </Button>
          <Button
            onClick={onAccept}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Accept & Continue</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorOnboardingAgreement;
