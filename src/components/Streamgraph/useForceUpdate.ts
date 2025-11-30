import { useState, useCallback } from 'react';

export default function useForceUpdate() {
    const [, setValue] = useState(0);
    return useCallback(() => setValue((value) => value + 1), []);
}
