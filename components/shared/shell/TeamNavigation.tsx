import { Cog6ToothIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    // {
    //   name: t('all-products'),
    //   href: `/teams/${slug}/products`,
    //   icon: CodeBracketIcon,
    //   active: activePathname === `/teams/${slug}/products`,
    // },
    {
      name: t('team-todos'),
      href: `/teams/${slug}/todos`,
      icon: QueueListIcon,
      active: activePathname === `/teams/${slug}/todos`,
    },
    {
      name: t('team-work'),
      href: `/teams/${slug}/work`,
      icon: QueueListIcon,
      active: activePathname === `/teams/${slug}/work`,
    },
    {
      name: t('settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active:
        activePathname?.startsWith(`/teams/${slug}`) &&
        !activePathname.includes('products'),
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default TeamNavigation;
