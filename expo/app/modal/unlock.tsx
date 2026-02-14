import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Lock, Unlock, Shield, Check } from 'lucide-react-native';

export default function UnlockModal() {
  const router = useRouter();
  const [requestSent, setRequestSent] = useState(false);

  // Mock data for the context
  // In a real app, these would come from props or a store based on the current chat
  const messageCount = 18;
  const requiredCount = 20;
  // For demo purposes, let's pretend we are ready for the "Happy Path" demo.
  const isReady = true;

  const handleRequest = () => {
    setRequestSent(true);
    // API call would go here
  };

  return (
    <View className="flex-1 bg-surface items-center justify-center p-6">

      {/* Visual Icon */}
      <View className="mb-8 items-center">
        <View className="w-24 h-24 rounded-full bg-surface-elevated items-center justify-center border border-white/5 mb-6">
            {requestSent ? (
                <Check size={48} color="#16A34A" />
            ) : (
                <Lock size={48} color="#7C3AED" />
            )}
        </View>

        <Typography variant="h1" className="text-center mb-2">
            {requestSent ? "Request Sent" : "Unlock Photos?"}
        </Typography>

        <Typography variant="body" color="muted" className="text-center max-w-[280px]">
            {requestSent
                ? "Waiting for them to accept. You'll be notified when the photos are revealed."
                : "Revealing photos requires mutual consent. Both of you must agree to unlock."
            }
        </Typography>
      </View>

      {/* Progress / Requirements */}
      {!requestSent && (
          <Card variant="elevated" className="w-full mb-8">
            <View className="flex-row justify-between items-center mb-2">
                <Typography variant="label">Conversation Depth</Typography>
                <Typography variant="label" color={isReady ? "success" : "muted"}>
                    {isReady ? "Ready to unlock" : `${messageCount}/${requiredCount} messages`}
                </Typography>
            </View>
            <View className="h-2 bg-background rounded-full overflow-hidden">
                <View
                    className={`h-full ${isReady ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: isReady ? '100%' : `${(messageCount / requiredCount) * 100}%` }}
                />
            </View>
            {!isReady && (
                <Typography variant="caption" color="muted" className="mt-2">
                    Keep chatting to build trust before unlocking.
                </Typography>
            )}
          </Card>
      )}

      {/* Actions */}
      <View className="w-full space-y-3">
        {!requestSent ? (
            <>
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!isReady}
                    onPress={handleRequest}
                    icon={<Unlock size={20} color={!isReady ? "#A6A6B2" : "#FFFFFF"} />}
                >
                    {isReady ? "Request to Reveal" : "Chat More to Unlock"}
                </Button>
                <Button
                    variant="ghost"
                    className="w-full"
                    onPress={() => router.back()}
                >
                    Maybe Later
                </Button>
            </>
        ) : (
            <Button
                variant="secondary"
                className="w-full"
                onPress={() => router.back()}
            >
                Back to Chat
            </Button>
        )}
      </View>

      {/* Safety Note */}
      <View className="flex-row items-center mt-8 opacity-60">
        <Shield size={14} color="#A6A6B2" className="mr-2" />
        <Typography variant="caption" color="muted">
            Your safety is our priority. Photos are private until unlocked.
        </Typography>
      </View>

    </View>
  );
}
