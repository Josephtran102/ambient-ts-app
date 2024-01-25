import { useContext } from 'react';
import Divider from '../../../components/Global/Divider/Divider';
import { XpLeadersContext } from '../../../contexts/XpLeadersContext';
import RankHeader from './RankHeader';
import RankRow from './RankRow';
import styles from './RankTable.module.css';
import { trimString } from '../../../ambient-utils/dataLayer';
import { SpinnerContainer } from '../../../styled/Components/Analytics';
import Spinner from '../../../components/Global/Spinner/Spinner';

interface Props {
    selectedTimeFrame: string;
    isLoading: boolean;
}
export default function RankTable(props: Props) {
    const { isLoading } = props;

    const { xpLeadersData } = useContext(XpLeadersContext);
    const formattedData =
        xpLeadersData?.data?.map((entry) => ({
            rank: entry.leaderboardRank,
            walletDisplay: trimString(entry.userAddress ?? '', 6, 6, '…'),
            userAddress: entry.userAddress,
            points: entry.totalPoints.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
            currentLevel: entry.currentLevel.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
        })) || [];

    const loadingSpinner = (
        <SpinnerContainer
            fullHeight
            fullWidth
            alignItems='center'
            justifyContent='center'
        >
            <Spinner size={100} bg='var(--dark1)' centered />
        </SpinnerContainer>
    );

    return (
        <div className={styles.main_table}>
            <RankHeader />
            <Divider />
            <div className={styles.main_table_content}>
                {isLoading
                    ? loadingSpinner
                    : formattedData?.map((data, idx) => (
                          <RankRow key={idx} data={data} />
                      ))}
            </div>
        </div>
    );
}
