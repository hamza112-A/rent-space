import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { XCircle, RefreshCw, Home } from 'lucide-react';

const PaymentFailed: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t.payment.failed}</h1>
              <p className="text-muted-foreground mb-6">
                Your payment could not be processed. Please try again or use a different payment method.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate(-1)} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" /> {t.payment.retry}
                </Button>
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

export default PaymentFailed;