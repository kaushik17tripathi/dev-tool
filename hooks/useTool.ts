import { useState, useCallback, useEffect, useRef } from 'react';
import { decompressState } from '@/lib/shareUtils';

export interface UseToolOptions<T> {
    onProcess: (input: string) => T | Promise<T>;
    initialInput?: string;
    debounceMs?: number;
}

export function useTool<T>({ onProcess, initialInput = '', debounceMs = 0 }: UseToolOptions<T>) {
    const [input, setInput] = useState(initialInput);
    const [output, setOutput] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);
    const initialized = useRef(false);

    // Deep-link support: check URL for compressed state 's'
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const params = new URLSearchParams(window.location.search);
        const sharedState = params.get('s');
        if (sharedState) {
            const decompressed = decompressState(sharedState);
            if (decompressed) {
                setInput(decompressed);
            }
        }
    }, []);

    const processInput = useCallback(async (value: string) => {
        if (!value.trim()) {
            setOutput(null);
            setError(null);
            return;
        }

        setIsProcessing(true);
        try {
            const result = await onProcess(value);
            setOutput(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'An error occurred during processing.');
            setOutput(null);
        } finally {
            setIsProcessing(false);
        }
    }, [onProcess]);

    useEffect(() => {
        if (debounceMs > 0) {
            const timer = setTimeout(() => {
                processInput(input);
            }, debounceMs);
            return () => clearTimeout(timer);
        } else {
            processInput(input);
        }
    }, [input, processInput, debounceMs]);

    const handleCopy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setShowCopyFeedback(true);
            setTimeout(() => setShowCopyFeedback(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }, []);

    const handleClear = useCallback(() => {
        setInput('');
        setOutput(null);
        setError(null);
    }, []);

    return {
        input,
        setInput,
        output,
        setOutput,
        error,
        isProcessing,
        showCopyFeedback,
        handleCopy,
        handleClear,
    };
}
