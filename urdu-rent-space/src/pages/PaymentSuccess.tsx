import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Home, Calendar } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t.payment.success}</h1>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              <div className="space-y-3">
                <Link to="/dashboard?tab=bookings">
                  <Button className="w-full gap-2">
                    <Calendar className="h-4 w-4" /> View My Bookings
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="h-4 w-4" /> {t.nav.home}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;