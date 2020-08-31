import styles from './index.module.css'
import { CircularProgress, Box } from '@chakra-ui/core'

export const AppLoadingOverlay = () => {
    return <div className={styles.overlay}>
        <Box display='flex' flex={1} flexDirection='column' alignItems='center' justifyItems='center' justifyContent='center'>
            <div>
                <img alt="Type One Gym" className={styles.logo} src="/images/logo.png"/>
            </div>
            <div>
                <CircularProgress isIndeterminate size="xl" color="green"/>
            </div>
        </Box>
    </div>
}