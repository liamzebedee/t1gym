import styles from './index.module.css'
import { CircularProgress, Box } from '@chakra-ui/core'

import { useTransition, animated } from 'react-spring'

export const AppLoadingOverlay = ({ show = true }) => {
    const transitions = useTransition(show, null, {
        from: { position: 'absolute', opacity: 0 },
        enter: {
            opacity: 1,
        },
        leave: {
            opacity: 0,
        },
    })

    return transitions.map(({ item, key, props }) =>
        item && <animated.div key={key} style={props}>
            <div className={styles.overlay}>
                <Box display='flex' flex={1} flexDirection='column' alignItems='center' justifyItems='center' justifyContent='center'>
                    <div>
                        <img alt="Type One Gym" className={styles.logo} src="/images/logo.png" />
                    </div>
                    <div>
                        <CircularProgress isIndeterminate size="xl" color="green" />
                    </div>
                </Box>
            </div>
        </animated.div>
    )
}